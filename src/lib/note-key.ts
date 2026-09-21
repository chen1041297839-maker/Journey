export function noteKey(url: string): string {
  try {
    const parsed = new URL(url)
    const xhs = parsed.pathname.match(/\/(?:explore|discovery\/item)\/([a-f0-9]+)/i)
    if (xhs) return xhs[1].slice(0, 8)
    const ig = parsed.pathname.match(/\/(?:p|reel|tv)\/([^/]+)/i)
    if (ig) return ig[1]
    const dy = parsed.pathname.match(/(\d{15,})/)
    if (dy) return dy[1]
  } catch {
    /* ignore */
  }
  const fallback = url.match(/(\d{15,})|[A-Za-z0-9_-]{10,}/)
  return fallback?.[0] || url
}

export function isStoredPhoto(src?: string): boolean {
  if (!src) return false
  if (src.startsWith("data:image/")) return true
  if (src.startsWith("/api/files/")) return true
  if (src.startsWith("/uploads/") && !src.endsWith(".svg")) return true
  return src.startsWith("/evidence/") && !src.endsWith(".svg")
}
