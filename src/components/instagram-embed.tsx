"use client"

import { instagramEmbedSrc, isRealInstagramUrl } from "@/lib/evidence"

export function InstagramEmbed({ url }: { url: string; isSample: boolean }) {
  const src = instagramEmbedSrc(url)
  if (!src) return null
  return (
    <iframe
      title="Instagram 官方 embed"
      src={src}
      className="h-[480px] w-full rounded-xl border border-border bg-card"
      allow="encrypted-media; clipboard-write"
      loading="lazy"
    />
  )
}

export function canEmbedInstagram(url: string, isSample: boolean) {
  return isRealInstagramUrl(url, isSample)
}
