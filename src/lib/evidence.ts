import type { Evidence, Platform } from "@/data/types"

export { platformLabel } from "@/data/types"

const SAMPLE_URL: Record<Platform, string> = {
  xiaohongshu: "https://www.xiaohongshu.com/explore/sample-xenia-trip",
  douyin: "https://www.douyin.com/video/sample-xenia-trip",
  instagram: "https://www.instagram.com/p/samplexenia/",
}

export function uniqueByUrl(list: Evidence[]): Evidence[] {
  const seen = new Set<string>()
  const next: Evidence[] = []
  for (const item of list) {
    if (item.isSample) continue
    if (seen.has(item.url)) continue
    seen.add(item.url)
    next.push(item)
  }
  return next
}

export function sampleEvidence(
  seed: string,
  platform: Platform,
  caption: string,
  quote: string
): Evidence {
  return {
    id: `sample-${seed}`,
    platform,
    url: SAMPLE_URL[platform],
    caption,
    quote,
    imageSrc: `/samples/${platform}.svg`,
    imageAlt: `示例配图 · ${caption}`,
    isSample: true,
  }
}

export function isRealInstagramUrl(url: string, isSample: boolean): boolean {
  if (isSample) return false
  try {
    const parsed = new URL(url)
    if (!parsed.hostname.endsWith("instagram.com")) return false
    return /\/(p|reel|tv)\//i.test(parsed.pathname)
  } catch {
    return false
  }
}

export function instagramEmbedSrc(url: string): string | null {
  try {
    const parsed = new URL(url)
    const match = parsed.pathname.match(/\/(p|reel|tv)\/([^/]+)/i)
    if (!match) return null
    return `https://www.instagram.com/${match[1]}/${match[2]}/embed`
  } catch {
    return null
  }
}

const platforms: Platform[] = ["xiaohongshu", "douyin", "instagram"]

export function platformForSeed(seed: string): Platform {
  let hash = 0
  for (const char of seed) hash = (hash + char.charCodeAt(0)) % 97
  return platforms[hash % platforms.length]
}
