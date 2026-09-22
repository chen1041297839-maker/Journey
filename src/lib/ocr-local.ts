import { spawnSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { OcrLine } from "@/data/types"
import { cleanCjkText } from "@/lib/cjk-text"

function tesseractAvailable(): boolean {
  const result = spawnSync("tesseract", ["--version"], { encoding: "utf8" })
  return result.status === 0
}

function parseTsv(tsv: string): OcrLine[] {
  const rows = tsv.split("\n").slice(1).map((line) => line.split("\t"))
  const byLine = new Map<string, { parts: string[]; confs: number[] }>()
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
  return [...byLine.values()]
    .map((bucket) => {
      const text = cleanCjkText(bucket.parts.join("").replace(/\s+/g, "").trim())
      const confidence = Math.round(
        bucket.confs.reduce((sum, value) => sum + value, 0) / bucket.confs.length
      )
      return {
        text,
        confidence,
        uncertain: confidence < 60,
        engine: "tesseract" as const,
      }
    })
    .filter((line) => {
      if (line.text.length < 2) return false
      if (/^小红书$/.test(line.text)) return false
      const cjk = (line.text.match(/[\u4e00-\u9fff]/g) || []).length
      return cjk >= 2 || (/\d/.test(line.text) && cjk >= 1)
    })
}

export function ocrLocalImage(filePath: string): OcrLine[] {
  if (!tesseractAvailable()) return []
  const dir = mkdtempSync(join(tmpdir(), "xenia-ocr-"))
  const outBase = join(dir, "out")
  try {
    const result = spawnSync(
      "tesseract",
      [filePath, outBase, "-l", "chi_sim+eng", "--psm", "6", "tsv"],
      { encoding: "utf8", timeout: 20000 }
    )
    if (result.status !== 0) return []
    const tsv = readFileSync(`${outBase}.tsv`, "utf8")
    return parseTsv(tsv)
  } catch {
    return []
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

export function ocrImageBuffer(bytes: Buffer, hint = "jpg"): OcrLine[] {
  if (!tesseractAvailable()) return []
  const dir = mkdtempSync(join(tmpdir(), "xenia-ocr-"))
  const input = join(dir, `in.${hint}`)
  try {
    writeFileSync(input, bytes)
    return ocrLocalImage(input)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}
