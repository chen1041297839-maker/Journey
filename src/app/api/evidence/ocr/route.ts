import { createHash } from "node:crypto"
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { NextResponse } from "next/server"
import { extractFactsFromText } from "@/lib/extract-facts"
import { ocrLocalImage } from "@/lib/ocr-local"
import type { OcrLine } from "@/data/types"

export const runtime = "nodejs"
export const maxDuration = 60

const EVIDENCE_DIR = join(process.cwd(), "public/evidence")
const MAX_FILES = 12
const MAX_BYTES = 6_000_000

function extOf(type: string, name: string): string | null {
  if (/png/i.test(type) || /\.png$/i.test(name)) return "png"
  if (/webp/i.test(type) || /\.webp$/i.test(name)) return "webp"
  if (/jpe?g/i.test(type) || /\.jpe?g$/i.test(name)) return "jpg"
  return null
}

function mergeLines(current: OcrLine[], extra: OcrLine[]): OcrLine[] {
  const next = [...current]
  for (const line of extra) {
    if (next.some((item) => item.text === line.text)) continue
    next.push(line)
  }
  return next
}

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null)
  if (!form) {
    return NextResponse.json({ error: "请上传或粘贴清单截图。" }, { status: 400 })
  }

  const files = form
    .getAll("images")
    .filter((item): item is File => item instanceof File && item.size > 0)
  if (files.length === 0) {
    return NextResponse.json({ error: "没有读到图片。可从相册选，或直接粘贴截图。" }, { status: 400 })
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: "一次最多 12 张截图。" }, { status: 400 })
  }

  mkdirSync(EVIDENCE_DIR, { recursive: true })
  const images: { src: string; alt: string }[] = []
  let ocrLines: OcrLine[] = []

  for (const file of files) {
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: `${file.name} 太大，请压到 6MB 以内。` }, { status: 400 })
    }
    const ext = extOf(file.type, file.name)
    if (!ext) {
      return NextResponse.json({ error: "只读 jpg / png / webp 截图。" }, { status: 400 })
    }
    const bytes = Buffer.from(await file.arrayBuffer())
    const hash = createHash("sha1").update(bytes).digest("hex").slice(0, 12)
    const filename = `live-upload-${hash}.${ext}`
    writeFileSync(join(EVIDENCE_DIR, filename), bytes)
    const src = `/evidence/${filename}`
    images.push({ src, alt: file.name || "上传的清单截图" })
    ocrLines = mergeLines(ocrLines, ocrLocalImage(join(EVIDENCE_DIR, filename)))
  }

  const facts = extractFactsFromText("", ocrLines)
  return NextResponse.json({
    images,
    ocrLines,
    facts,
  })
}
