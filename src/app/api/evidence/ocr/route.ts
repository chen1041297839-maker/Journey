import { NextResponse } from "next/server"
import { attachOcrPayloadToTrip } from "@/lib/attach-evidence"
import { extractFactsFromText } from "@/lib/extract-facts"
import { ocrImageBuffer } from "@/lib/ocr-local"
import { mutateSharedTrip, putStoredImage } from "@/lib/persist"
import type { OcrLine } from "@/data/types"

export const runtime = "nodejs"
export const maxDuration = 60
export const dynamic = "force-dynamic"

const MAX_FILES = 12
const MAX_BYTES = 6_000_000

function extOf(type: string, name: string): string | null {
  if (/png/i.test(type) || /\.png$/i.test(name)) return "png"
  if (/webp/i.test(type) || /\.webp$/i.test(name)) return "webp"
  if (/jpe?g/i.test(type) || /\.jpe?g$/i.test(name)) return "jpg"
  return null
}

function mimeOf(ext: string): string {
  if (ext === "png") return "image/png"
  if (ext === "webp") return "image/webp"
  return "image/jpeg"
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

  const dayId = String(form.get("dayId") || "")
  const stopId = String(form.get("stopId") || "")
  const files = form
    .getAll("images")
    .filter((item): item is File => item instanceof File && item.size > 0)
  if (files.length === 0) {
    return NextResponse.json({ error: "没有读到图片。可从相册选，或直接粘贴截图。" }, { status: 400 })
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: "一次最多 12 张截图。" }, { status: 400 })
  }

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
    const src = await putStoredImage(bytes, mimeOf(ext), ext, "upload")
    images.push({ src, alt: file.name || "上传的清单截图" })
    ocrLines = mergeLines(ocrLines, ocrImageBuffer(bytes, ext))
  }

  const facts = extractFactsFromText("", ocrLines)
  if (!dayId || !stopId) {
    return NextResponse.json({ images, ocrLines, facts })
  }

  const attached = await mutateSharedTrip((current) => {
    const result = attachOcrPayloadToTrip(current, { dayId, stopId }, { images, ocrLines, facts })
    if (!result) throw new Error("STOP_NOT_FOUND")
    return result.trip
  }).catch((error: unknown) => {
    if (error instanceof Error && error.message === "STOP_NOT_FOUND") return null
    throw error
  })

  if (!attached) {
    return NextResponse.json({ error: "找不到这一站。" }, { status: 404 })
  }

  return NextResponse.json({
    trip: attached,
    images,
    ocrLines,
    facts,
    stopName: attached.days.flatMap((day) => day.stops).find((stop) => stop.id === stopId)?.name,
    ocrCount: ocrLines.length,
    imageCount: images.length,
  })
}
