import { NextResponse } from "next/server"
import { getStoredImage } from "@/lib/persist"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: raw } = await context.params
  const id = decodeURIComponent(raw || "").replace(/[/\\]/g, "")
  if (!id) {
    return NextResponse.json({ error: "找不到这张图。" }, { status: 404 })
  }
  const file = await getStoredImage(id)
  if (!file) {
    return NextResponse.json({ error: "找不到这张图。" }, { status: 404 })
  }
  const mime = file.mime || MIME[file.ext] || "application/octet-stream"
  return new NextResponse(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}
