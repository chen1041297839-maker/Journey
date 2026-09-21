import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { noteKey } from "@/lib/note-key"

const EVIDENCE_DIR = join(process.cwd(), "public/evidence")

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

function refererFor(url: string): string {
  try {
    const host = new URL(url).hostname
    if (host.includes("xiaohongshu") || host.includes("xhscdn") || host.includes("sns-webpic")) {
      return "https://www.xiaohongshu.com/"
    }
    if (host.includes("instagram") || host.includes("cdninstagram") || host.includes("fbcdn")) {
      return "https://www.instagram.com/"
    }
    if (host.includes("douyin") || host.includes("byteimg") || host.includes("iesdouyin")) {
      return "https://www.douyin.com/"
    }
  } catch {
    /* ignore */
  }
  return "https://www.xiaohongshu.com/"
}

function extensionOf(bytes: Buffer, contentType: string, url: string): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "jpg"
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return "png"
  if (bytes.slice(0, 4).toString() === "RIFF" && bytes.slice(8, 12).toString() === "WEBP") {
    return "webp"
  }
  if (/jpeg|jpg/i.test(contentType) || /\.jpe?g(\?|$)/i.test(url)) return "jpg"
  if (/png/i.test(contentType) || /\.png(\?|$)/i.test(url)) return "png"
  if (/webp/i.test(contentType) || /\.webp(\?|$)/i.test(url)) return "webp"
  return null
}

export function existingEvidenceFiles(url: string): string[] {
  if (!existsSync(EVIDENCE_DIR)) return []
  const key = noteKey(url).toLowerCase()
  if (key.length < 6) return []
  return readdirSync(EVIDENCE_DIR)
    .filter((name) => name.toLowerCase().includes(key) && /\.(jpe?g|png|webp)$/i.test(name))
    .sort()
    .map((name) => `/evidence/${name}`)
}

export async function downloadPublicImage(
  imageUrl: string,
  pageUrl: string,
  index: number
): Promise<{ path: string; bytes: Buffer } | null> {
  if (!imageUrl.startsWith("http")) return null
  if (/picasso-static|fe-platform|avatar|favicon|sprite/i.test(imageUrl)) return null
  try {
    const response = await fetch(imageUrl, {
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "User-Agent": BROWSER_UA,
        Referer: refererFor(imageUrl),
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      },
      redirect: "follow",
      cache: "no-store",
    })
    if (!response.ok) return null
    const bytes = Buffer.from(await response.arrayBuffer())
    if (bytes.length < 800 || bytes.length > 6_000_000) return null
    const ext = extensionOf(bytes, response.headers.get("content-type") || "", imageUrl)
    if (!ext) return null
    mkdirSync(EVIDENCE_DIR, { recursive: true })
    const stem = `${noteKey(pageUrl)}-${index + 1}-${createHash("sha1").update(imageUrl).digest("hex").slice(0, 8)}`
    const filename = `live-${stem}.${ext}`
    const abs = join(EVIDENCE_DIR, filename)
    if (!existsSync(abs)) writeFileSync(abs, bytes)
    return { path: `/evidence/${filename}`, bytes }
  } catch {
    return null
  }
}
