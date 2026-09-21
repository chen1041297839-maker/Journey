import type { Evidence, OcrLine, Platform, Stop, Trip } from "@/data/types"
import type { ExtractedFacts } from "@/lib/extract-facts"

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

const MOBILE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"

export type FetchedPost = {
  url: string
  canonicalUrl: string
  platform: Platform
  caption: string
  quote: string
  imageSrc: string
  imageAlt: string
  partialRead: boolean
  commentsGated: boolean
  imageListPartial: boolean
  remoteImageUrls?: string[]
  expectedImageCount?: number
  storedImages?: string[]
  ocrLines?: OcrLine[]
  facts?: ExtractedFacts
}

const URL_RE =
  /https?:\/\/[^\s<>"']+|https?:\/\/xhslink\.com\/[^\s<>"']+|https?:\/\/v\.douyin\.com\/[^\s<>"']+/gi

export function extractPostUrls(text: string): string[] {
  const found = text.match(URL_RE) || []
  const cleaned = found.map((raw) => raw.replace(/[),.;]+$/, ""))
  return Array.from(new Set(cleaned))
}

export function detectPlatform(url: string): Platform | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "")
    if (host.endsWith("xiaohongshu.com") || host === "xhslink.com") return "xiaohongshu"
    if (host.endsWith("douyin.com") || host.endsWith("iesdouyin.com") || host.endsWith("tiktok.com")) {
      return "douyin"
    }
    if (host.endsWith("instagram.com")) return "instagram"
    return null
  } catch {
    return null
  }
}

export function isSocialPostUrl(url: string): boolean {
  return detectPlatform(url) !== null
}

function meta(html: string, property: string): string {
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, "i"),
  ]
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) return decodeHtml(match[1]).trim()
  }
  return ""
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\\u0026/g, "&")
}

function titleTag(html: string): string {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return decodeHtml(match?.[1] || "").trim()
}

function usableImage(url: string): string {
  if (!url) return ""
  const absolute = url.startsWith("//") ? `https:${url}` : url
  if (/ci\.xiaohongshu\.com\/\?/.test(absolute)) return ""
  if (/picasso-static\.xiaohongshu\.com\/fe-platform/.test(absolute)) return ""
  return absolute
}

function isGated(html: string, title: string, status: number, finalUrl: string): boolean {
  if (status === 401 || status === 403 || status === 404) return true
  if (/\/login\b/i.test(finalUrl)) return true
  if (/error_code=300031|页面不见了/.test(html.slice(0, 4000))) return true
  const blob = `${title}\n${html.slice(0, 2500)}`
  return /请[先在].{0,6}(登录|登陆)|打开\s*(App|APP)|人机验证|Log in to Instagram|login to continue|仅限.*查看/i.test(
    blob
  )
}

function genericTitle(platform: Platform, title: string): boolean {
  const compact = title.replace(/\s+/g, "")
  if (!compact || compact === "-小红书") return true
  if (platform === "xiaohongshu" && /^(小红书|你的生活兴趣社区|小红书-你访问的页面不见了|-小红书)$/.test(compact)) {
    return true
  }
  if (platform === "douyin" && /^(抖音|Douyin)$/i.test(compact)) return true
  if (platform === "instagram" && /^(instagram|login)/i.test(title)) return true
  return false
}

function candidateUrls(rawUrl: string, platform: Platform): string[] {
  const urls = [rawUrl]
  if (platform !== "xiaohongshu") return urls
  try {
    const parsed = new URL(rawUrl)
    if (parsed.pathname.includes("/discovery/item/")) {
      const explore = rawUrl.replace("/discovery/item/", "/explore/")
      urls.unshift(explore)
    }
  } catch {
    /* ignore */
  }
  return Array.from(new Set(urls))
}

async function fetchHtml(
  url: string,
  userAgent: string
): Promise<{ html: string; finalUrl: string; status: number }> {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "User-Agent": userAgent,
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    },
    redirect: "follow",
    cache: "no-store",
  })
  const html = await response.text()
  return { html, finalUrl: response.url || url, status: response.status }
}

function collectPublicComments(data: unknown): string[] {
  const comments: string[] = []
  const walk = (obj: unknown, depth: number, inCommentTree: boolean) => {
    if (!obj || typeof obj !== "object" || depth > 10 || comments.length >= 12) return
    if (Array.isArray(obj)) {
      for (const item of obj.slice(0, 80)) walk(item, depth + 1, inCommentTree)
      return
    }
    const rec = obj as Record<string, unknown>
    const keys = Object.keys(rec)
    const tree =
      inCommentTree ||
      keys.some((key) => /commentList|subCommentList|comments/i.test(key))
    const content =
      typeof rec.content === "string"
        ? rec.content
        : typeof rec.commentContent === "string"
          ? rec.commentContent
          : ""
    if (
      tree &&
      content.length > 4 &&
      content.length < 280 &&
      (rec.user || rec.nickname || rec.commentId || rec.id) &&
      !/打开\s*(App|APP)|仅支持在小红书|请先登录/.test(content)
    ) {
      comments.push(content.trim())
    }
    for (const [key, value] of Object.entries(rec)) {
      walk(value, depth + 1, tree || /commentList|subCommentList|comments/i.test(key))
    }
  }
  walk(data, 0, false)
  return Array.from(new Set(comments))
}

function parseXhsNote(html: string): {
  title: string
  desc: string
  imageSrc: string
  imageSrcs: string[]
  expectedImageCount: number
  comments: string[]
  commentsGated: boolean
} | null {
  const match = html.match(/window\.__INITIAL_STATE__=([\s\S]*?)<\/script>/)
  if (!match) return null
  const text = match[1].trim().replace(/;$/, "").replace(/\bundefined\b/g, "null")
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return null
  }

  type NoteLike = {
    title?: unknown
    displayTitle?: unknown
    desc?: unknown
    noteId?: unknown
    user?: unknown
    imageList?: unknown
  }
  const found: NoteLike[] = []

  const walk = (obj: unknown, depth = 0) => {
    if (!obj || typeof obj !== "object" || depth > 8) return
    if (Array.isArray(obj)) {
      for (const item of obj.slice(0, 60)) walk(item, depth + 1)
      return
    }
    const rec = obj as NoteLike & Record<string, unknown>
    const desc = typeof rec.desc === "string" ? rec.desc : ""
    const titled = typeof rec.title === "string" || typeof rec.displayTitle === "string"
    if ((titled || desc) && (rec.imageList || rec.user || rec.noteId)) {
      found.push(rec)
    }
    for (const value of Object.values(rec)) walk(value, depth + 1)
  }
  walk(data)
  const best = found.sort((a, b) => String(b.desc || "").length - String(a.desc || "").length)[0]
  if (!best) return null

  const title = String(best.title || best.displayTitle || "").trim()
  const desc = String(best.desc || "")
    .replace(/\[话题\]/g, "")
    .replace(/\[[^\]]+[RH]\]/g, "")
    .trim()
  let imageSrc = ""
  const imageSrcs: string[] = []
  const images = Array.isArray(best.imageList) ? best.imageList : []
  for (const img of images) {
    if (!img || typeof img !== "object") continue
    const rec = img as Record<string, unknown>
    const candidates = [
      rec.urlDefault,
      rec.urlPre,
      rec.url,
      rec.urlOriginal,
      rec.masterUrl,
    ]
    const info = rec.infoList
    if (Array.isArray(info)) {
      for (const entry of info) {
        if (entry && typeof entry === "object") {
          candidates.push((entry as Record<string, unknown>).url)
        }
      }
    }
    for (const candidate of candidates) {
      const direct = usableImage(String(candidate || ""))
      if (!direct) continue
      if (!imageSrc) imageSrc = direct
      if (!imageSrcs.includes(direct)) imageSrcs.push(direct)
    }
  }
  if (!title && !desc && !imageSrc) return null
  const comments = collectPublicComments(data)
  return {
    title: title || desc.slice(0, 42),
    desc,
    imageSrc,
    imageSrcs,
    expectedImageCount: Math.max(images.length, imageSrcs.length),
    comments,
    commentsGated: comments.length === 0,
  }
}

async function fetchInstagramOembed(url: string): Promise<{ caption: string; quote: string; imageSrc: string } | null> {
  const endpoints = [
    `https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(url)}&omitscript=true`,
    `https://api.instagram.com/oembed?url=${encodeURIComponent(url)}`,
  ]
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: { Accept: "application/json", "User-Agent": BROWSER_UA },
        cache: "no-store",
      })
      if (!response.ok) continue
      const data = (await response.json()) as {
        title?: string
        author_name?: string
        thumbnail_url?: string
      }
      if (!data.title && !data.thumbnail_url) continue
      return {
        caption: data.title || "Instagram 帖子",
        quote: data.author_name ? `来自 @${data.author_name}` : data.title || "",
        imageSrc: data.thumbnail_url || "",
      }
    } catch {
      continue
    }
  }
  return null
}

export async function fetchPublicPost(rawUrl: string): Promise<FetchedPost> {
  const platform = detectPlatform(rawUrl)
  if (!platform) {
    throw new Error("只读取小红书、抖音或 Instagram 的公开链接。")
  }

  const fallback: FetchedPost = {
    url: rawUrl,
    canonicalUrl: rawUrl,
    platform,
    caption: "网页读不全",
    quote: "公开页打不开或需要 App。链接已保存，点开原帖查看。评论网页读不到。",
    imageSrc: `/samples/${platform}.svg`,
    imageAlt: "网页读不全，没有读到配图",
    partialRead: true,
    commentsGated: true,
    imageListPartial: false,
    remoteImageUrls: [],
    expectedImageCount: 0,
  }

  try {
    if (platform === "instagram") {
      const oembed = await fetchInstagramOembed(rawUrl)
      if (oembed?.caption || oembed?.imageSrc) {
        return {
          url: rawUrl,
          canonicalUrl: rawUrl,
          platform,
          caption: oembed.caption || "Instagram 帖子",
          quote: (oembed.quote || oembed.caption).slice(0, 280),
          imageSrc: oembed.imageSrc || `/samples/${platform}.svg`,
          imageAlt: oembed.caption || "Instagram 配图",
          partialRead: !oembed.imageSrc || !oembed.caption,
          commentsGated: true,
          imageListPartial: false,
          remoteImageUrls: oembed.imageSrc ? [oembed.imageSrc] : [],
          expectedImageCount: oembed.imageSrc ? 1 : 0,
        }
      }
    }

    const agents = platform === "xiaohongshu" ? [MOBILE_UA, BROWSER_UA] : [BROWSER_UA]
    for (const url of candidateUrls(rawUrl, platform)) {
      for (const agent of agents) {
        const { html, finalUrl, status } = await fetchHtml(url, agent)
        const note = platform === "xiaohongshu" ? parseXhsNote(html) : null
        if (note && (note.desc.length > 0 || (note.title && !genericTitle(platform, note.title)))) {
          const caption = note.title || "小红书笔记"
          const body = note.desc || "公开页只读到标题和配图。"
          const commentBit =
            note.comments.length > 0
              ? `评论：${note.comments.slice(0, 3).join(" / ")}`
              : "评论网页读不到。"
          return {
            url: rawUrl,
            canonicalUrl: finalUrl.includes("/login") ? rawUrl : finalUrl,
            platform,
            caption: caption.slice(0, 120),
            quote: `${body} ${commentBit}`.slice(0, 420),
            imageSrc: note.imageSrc || `/samples/${platform}.svg`,
            imageAlt: caption,
            partialRead: !note.desc || !note.imageSrc,
            commentsGated: note.commentsGated,
            imageListPartial: note.expectedImageCount > 1 && note.imageSrcs.length < note.expectedImageCount,
            remoteImageUrls: note.imageSrcs,
            expectedImageCount: note.expectedImageCount,
          }
        }

        const ogTitle = meta(html, "og:title") || meta(html, "twitter:title") || titleTag(html)
        const ogDesc = meta(html, "og:description") || meta(html, "description") || meta(html, "twitter:description")
        const ogImage = usableImage(meta(html, "og:image") || meta(html, "twitter:image"))
        const gated = isGated(html, ogTitle, status, finalUrl) || genericTitle(platform, ogTitle)
        if (gated && genericTitle(platform, ogTitle)) continue
        const caption = ogTitle || "网页读不全"
        const quote = ogDesc || (gated ? fallback.quote : caption)
        return {
          url: rawUrl,
          canonicalUrl: finalUrl.includes("/login") ? rawUrl : finalUrl,
          platform,
          caption: caption.slice(0, 120),
          quote: `${quote}${gated || platform !== "instagram" ? " 评论网页读不到。" : ""}`.slice(0, 420),
          imageSrc: ogImage || `/samples/${platform}.svg`,
          imageAlt: ogImage ? caption : "网页读不全，没有读到配图",
          partialRead: gated || !ogDesc || !ogImage,
          commentsGated: true,
          imageListPartial: false,
          remoteImageUrls: ogImage ? [ogImage] : [],
          expectedImageCount: ogImage ? 1 : 0,
        }
      }
    }
    return fallback
  } catch {
    return fallback
  }
}

export function fetchedToEvidence(post: FetchedPost, seed: string): Evidence {
  return {
    id: `paste-${seed}-${Math.abs(hashCode(post.canonicalUrl || post.url))}`,
    platform: post.platform,
    url: post.canonicalUrl || post.url,
    caption: post.caption,
    quote: post.quote,
    imageSrc: post.imageSrc,
    imageAlt: post.imageAlt,
    isSample: false,
    partialRead: post.partialRead,
    collectedBy: "paste",
    commentsGated: post.commentsGated,
    imageListPartial: post.imageListPartial,
    imageFiles: post.storedImages,
  }
}

function hashCode(value: string): number {
  let hash = 0
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return hash
}

function distinctiveTokens(name: string): string[] {
  const stripped = name.replace(/[|｜•·（）()【】\s]/g, "")
  const tokens = [stripped]
  if (stripped.length >= 4) tokens.push(stripped.slice(0, 4), stripped.slice(0, 6))
  const parts = name.split(/[|｜•·（）()\s]/).filter((part) => part.length >= 2)
  return Array.from(new Set([...tokens, ...parts]))
}

export function scoreStopMatch(stop: Stop, text: string): number {
  if (/酒店|民宿|客栈|溪宿/.test(stop.name) && !/酒店|民宿|客栈|溪宿/.test(text)) {
    return 0
  }
  const hay = text.toLowerCase()
  let score = 0
  for (const token of distinctiveTokens(stop.name)) {
    if (token.length < 2) continue
    if (hay.includes(token.toLowerCase())) score += token.length >= 4 ? 6 : 3
  }
  if (stop.area && hay.includes(stop.area.replace(/市$/, ""))) score += 1
  return score
}

export function matchStopInTrip(
  trip: Trip,
  text: string
): { dayId: string; stopId: string; name: string; score: number } | null {
  let best: { dayId: string; stopId: string; name: string; score: number } | null = null
  for (const day of trip.days) {
    for (const stop of day.stops) {
      const score = scoreStopMatch(stop, text)
      if (score <= 0) continue
      if (!best || score > best.score) {
        best = { dayId: day.id, stopId: stop.id, name: stop.name, score }
      }
    }
  }
  return best
}

export function guessSlot(text: string): "photo" | "shop" | "buy" | "outfit" {
  if (/穿搭|outfit|ootd|裙子|防晒衣/i.test(text)) return "outfit"
  if (/机位|站在哪|构图|观景台/i.test(text)) return "photo"
  if (/必买|伴手礼|手信|买什么|松子酥|奶茶|冰箱贴/i.test(text)) return "buy"
  if (/店|好吃|必吃|探店|菜单/i.test(text)) return "shop"
  return "photo"
}
