import { existsSync } from "node:fs"
import { join } from "node:path"
import type { OcrLine } from "@/data/types"
import { extractFactsFromText, type ExtractedFacts } from "@/lib/extract-facts"
import { ocrImageBuffer, ocrLocalImage } from "@/lib/ocr-local"
import { getStoredImage } from "@/lib/persist"
import type { FetchedPost } from "@/lib/social-posts"
import {
  downloadPublicImage,
  existingEvidenceFiles,
  existingStoredFiles,
} from "@/lib/store-public-image"

function absEvidence(src: string): string {
  return join(process.cwd(), "public", src.replace(/^\//, ""))
}

function mergeLines(current: OcrLine[], extra: OcrLine[]): OcrLine[] {
  const next = [...current]
  for (const line of extra) {
    if (next.some((item) => item.text === line.text)) continue
    next.push(line)
  }
  return next
}

function storedFileId(src: string): string | null {
  const match = src.match(/\/api\/files\/([^/?#]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

async function ocrStoredSrc(src: string): Promise<OcrLine[]> {
  const id = storedFileId(src)
  if (id) {
    const file = await getStoredImage(id)
    if (!file) return []
    return ocrImageBuffer(file.bytes, file.ext)
  }
  if (src.startsWith("/evidence/") || src.startsWith("/uploads/")) {
    const abs = absEvidence(src)
    if (!existsSync(abs)) return []
    return ocrLocalImage(abs)
  }
  return []
}

export async function enrichFetchedPost(post: FetchedPost): Promise<FetchedPost> {
  const stored = new Set([
    ...existingEvidenceFiles(post.url),
    ...(await existingStoredFiles(post.url)),
  ])
  const remote = post.remoteImageUrls?.length
    ? post.remoteImageUrls
    : post.imageSrc.startsWith("http")
      ? [post.imageSrc]
      : []

  for (const [index, imageUrl] of remote.slice(0, 6).entries()) {
    const saved = await downloadPublicImage(imageUrl, post.url, index)
    if (saved) stored.add(saved.path)
  }

  const files = [...stored]
  let ocrLines: OcrLine[] = []
  for (const src of files.slice(0, 4)) {
    ocrLines = mergeLines(ocrLines, await ocrStoredSrc(src))
  }

  const facts: ExtractedFacts = extractFactsFromText(`${post.caption}\n${post.quote}`, ocrLines)
  const expected = Math.max(post.expectedImageCount || 0, remote.length, files.length)
  const missing = Math.max(0, expected - files.length)
  const localSrc =
    files[0] ||
    (post.imageSrc.startsWith("/evidence/") || post.imageSrc.startsWith("/api/files/")
      ? post.imageSrc
      : "")

  return {
    ...post,
    imageSrc: localSrc || post.imageSrc,
    imageAlt: post.imageAlt,
    storedImages: files,
    ocrLines,
    facts,
    expectedImageCount: expected,
    imageListPartial: post.imageListPartial || missing > 0,
    partialRead: post.partialRead,
  }
}
