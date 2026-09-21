import { existsSync } from "node:fs"
import { join } from "node:path"
import type { OcrLine } from "@/data/types"
import { extractFactsFromText, type ExtractedFacts } from "@/lib/extract-facts"
import { ocrLocalImage } from "@/lib/ocr-local"
import type { FetchedPost } from "@/lib/social-posts"
import { downloadPublicImage, existingEvidenceFiles } from "@/lib/store-public-image"

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

export async function enrichFetchedPost(post: FetchedPost): Promise<FetchedPost> {
  const stored = new Set(existingEvidenceFiles(post.url))
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
    const abs = absEvidence(src)
    if (!existsSync(abs)) continue
    ocrLines = mergeLines(ocrLines, ocrLocalImage(abs))
  }

  const facts: ExtractedFacts = extractFactsFromText(
    `${post.caption}\n${post.quote}`,
    ocrLines
  )
  const expected = Math.max(post.expectedImageCount || 0, remote.length, files.length)
  const missing = Math.max(0, expected - files.length)
  const localSrc = files[0] || (post.imageSrc.startsWith("/evidence/") ? post.imageSrc : "")

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
