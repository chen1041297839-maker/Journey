"use client"

import { useRef, useState } from "react"
import type { Evidence } from "@/data/types"
import { platformLabel } from "@/data/types"
import { canEmbedInstagram, InstagramEmbed } from "@/components/instagram-embed"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function EvidenceCard({
  evidence,
  onChange,
}: {
  evidence: Evidence
  onChange?: (patch: Partial<Evidence>) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [urlDraft, setUrlDraft] = useState(evidence.isSample ? "" : evidence.url)
  const showEmbed = canEmbedInstagram(evidence.url, evidence.isSample)

  function onUpload(file: File | undefined) {
    if (!file || !onChange) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChange({ imageSrc: reader.result, imageAlt: file.name, isSample: false })
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <figure className="overflow-hidden rounded-xl border border-border bg-muted/30">
      <div className="relative aspect-[4/5] bg-muted">
        {showEmbed ? (
          <InstagramEmbed url={evidence.url} isSample={evidence.isSample} />
        ) : (
          // User-supplied URLs / data URLs are not run through next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={evidence.imageSrc}
            alt={evidence.imageAlt}
            className="size-full object-cover"
          />
        )}
        <div className="absolute top-2 left-2 flex gap-1">
          <Badge>{platformLabel[evidence.platform]}</Badge>
          {evidence.isSample ? (
            <Badge variant="secondary">示例</Badge>
          ) : evidence.partialRead ? (
            <Badge variant="secondary">网页读不全</Badge>
          ) : evidence.collectedBy === "search" ? (
            <Badge variant="secondary">系统检索</Badge>
          ) : null}
        </div>
      </div>
      <figcaption className="grid gap-2 px-3 py-3 text-sm">
        <p className="font-heading leading-snug">{evidence.caption}</p>
        <p className="text-muted-foreground leading-relaxed">{evidence.quote}</p>
        <a
          href={evidence.url}
          target="_blank"
          rel="noreferrer"
          className={cn(
            "truncate text-xs text-primary underline-offset-4 hover:underline",
            evidence.isSample && "opacity-80"
          )}
        >
          {evidence.isSample ? "示例链接（请替换）· " : "打开原帖 · "}
          {platformLabel[evidence.platform]}
        </a>
        {onChange ? (
          <div className="grid gap-2 pt-1">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => fileRef.current?.click()}
              >
                上传配图
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => onUpload(event.target.files?.[0])}
              />
            </div>
            <div className="flex gap-2">
              <Input
                value={urlDraft}
                placeholder="粘贴小红书 / 抖音 / Instagram 链接"
                onChange={(event) => setUrlDraft(event.target.value)}
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={!urlDraft.trim()}
                onClick={async () => {
                  const url = urlDraft.trim()
                  try {
                    const response = await fetch("/api/evidence/fetch", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ text: url }),
                    })
                    const payload = (await response.json()) as {
                      posts?: Array<{
                        canonicalUrl: string
                        platform: Evidence["platform"]
                        caption: string
                        quote: string
                        imageSrc: string
                        imageAlt: string
                        partialRead: boolean
                      }>
                    }
                    const post = payload.posts?.[0]
                    if (post) {
                      onChange({
                        url: post.canonicalUrl,
                        platform: post.platform,
                        caption: post.caption,
                        quote: post.quote,
                        imageSrc: post.imageSrc,
                        imageAlt: post.imageAlt,
                        isSample: false,
                        partialRead: post.partialRead,
                        collectedBy: "paste",
                      })
                      return
                    }
                  } catch {
                    // fall through to URL-only save
                  }
                  const platform = url.includes("instagram.com")
                    ? "instagram"
                    : url.includes("douyin.com") || url.includes("tiktok.com")
                      ? "douyin"
                      : "xiaohongshu"
                  onChange({
                    url,
                    platform,
                    isSample: false,
                    partialRead: true,
                    caption: "网页读不全",
                    quote: "公开页打不开或需要 App。链接已保存。",
                    collectedBy: "paste",
                  })
                }}
              >
                读取链接
              </Button>
            </div>
          </div>
        ) : null}
      </figcaption>
    </figure>
  )
}

export function EvidenceRow({
  evidence,
  onChangeAt,
}: {
  evidence: Evidence[]
  onChangeAt?: (index: number, patch: Partial<Evidence>) => void
}) {
  if (evidence.length === 0) return null
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {evidence.map((item, index) => (
        <EvidenceCard
          key={item.id}
          evidence={item}
          onChange={
            onChangeAt ? (patch) => onChangeAt(index, patch) : undefined
          }
        />
      ))}
    </div>
  )
}
