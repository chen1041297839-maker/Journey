#!/usr/bin/env node
/**
 * OCR already-saved public/evidence JPGs with tesseract chi_sim+eng.
 * Does not fetch App-gated galleries. Optional Pillow preprocess if python3+PIL exist.
 */
import { spawnSync } from "node:child_process"
import { mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs"
import { basename, join } from "node:path"

const evidenceDir = join(process.cwd(), "public/evidence")
const outDir = "/tmp/xenia-ocr"
mkdirSync(outDir, { recursive: true })

const preprocess = join(process.cwd(), "scripts/ocr-preprocess.py")
if (existsSync(preprocess)) {
  spawnSync("python3", [preprocess], { stdio: "inherit" })
}

function ocrFile(file, psm = "4") {
  const stem = basename(file).replace(/\.(jpg|jpeg|png)$/i, "")
  const outBase = join(outDir, `${stem}-psm${psm}`)
  const result = spawnSync(
    "tesseract",
    [file, outBase, "-l", "chi_sim+eng", "--psm", psm, "tsv"],
    { encoding: "utf8" }
  )
  if (result.status !== 0) {
    return { file: `/evidence/${basename(file)}`, psm, error: result.stderr, lines: [] }
  }
  const tsv = readFileSync(`${outBase}.tsv`, "utf8")
  const rows = tsv.split("\n").slice(1).map((line) => line.split("\t"))
  const byLine = new Map()
  for (const cols of rows) {
    if (cols.length < 12) continue
    const conf = Number(cols[10])
    const text = (cols[11] || "").trim()
    if (!text || Number.isNaN(conf) || conf < 0) continue
    const key = `${cols[2]}-${cols[3]}-${cols[4]}`
    const bucket = byLine.get(key) || { parts: [], confs: [] }
    bucket.parts.push(text)
    bucket.confs.push(conf)
    byLine.set(key, bucket)
  }
  const lines = [...byLine.values()]
    .map((bucket) => {
      const text = bucket.parts.join("").replace(/\s+/g, "").trim()
      const conf = Math.round(bucket.confs.reduce((a, b) => a + b, 0) / bucket.confs.length)
      return { text, conf, uncertain: conf < 60 }
    })
    .filter((line) => line.text.length >= 2)
  return { file: `/evidence/${basename(file)}`, psm, lines }
}

const jpgs = readdirSync(evidenceDir).filter((name) => /\.jpe?g$/i.test(name))
const report = jpgs.flatMap((name) => {
  const original = ocrFile(join(evidenceDir, name), "6")
  const prepared = join("/tmp/xenia-ocr/prep", `${basename(name, ".jpg")}.png`)
  if (existsSync(prepared)) return [original, ocrFile(prepared, "4")]
  return [original]
})

writeFileSync(join(outDir, "raw.json"), JSON.stringify(report, null, 2))
for (const item of report) {
  console.log("\n===", item.file, "psm", item.psm, "===")
  for (const line of item.lines) {
    console.log(`${line.uncertain ? "LOW" : "OK "} ${String(line.conf).padStart(3)}  ${line.text}`)
  }
}
