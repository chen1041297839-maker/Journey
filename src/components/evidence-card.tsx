"use client"

import { useRef, useState } from "react"
import type { Evidence } from "@/data/types"
import { platformLabel } from "@/data/types"
import { canEmbedInstagram, InstagramEmbed } from "@/components/instagram-embed"
import { Copy, Heading, Panel } from "@/components/layout-system"
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
  const hasPhoto = Boolean(evidence.imageSrc) || showEmbed

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
    <Panel className="p-0 gap-0 overflow-hidden">
      {hasPhoto ? (
        <div className="relative w-full bg-muted">
          {showEmbed ? (
            <InstagramEmbed url={evidence.url} isSample={evidence.isSample} />
          ) : (
            // User-supplied URLs / data URLs are not run through next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={evidence.imageSrc}
              alt={evidence.imageAlt}
              className="max-h-64 w-full object-cover"
            />
          )}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
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
      ) : null}
      <div className="flex w-full min-w-0 flex-col gap-2 p-5">
        {!hasPhoto ? (
          <div className="flex flex-wrap gap-1">
            <Badge>{platformLabel[evidence.platform]}</Badge>
            {evidence.isSample ? <Badge variant="secondary">示例</Badge> : null}
          </div>
        ) : null}
        <Heading as="h3" className="text-lg">
          {evidence.caption}
        </Heading>
        <Copy muted>{evidence.quote}</Copy>
        <a
          href={evidence.url}
          target="_blank"
          rel="noreferrer"
          className={cn(
            "cjk-flow text-xs leading-6 text-primary underline-offset-4 hover:underline",
            evidence.isSample && "opacity-80"
          )}
        >
          {evidence.isSample ? "示例链接（请替换）· " : "打开原帖 · "}
          {platformLabel[evidence.platform]}
        </a>
        {onChange ? (
          <div className="flex w-full min-w-0 flex-col gap-2 pt-1">
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
            <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row">
              <Input
                value={urlDraft}
                placeholder="粘贴小红书 / 抖音 / Instagram 链接"
                onChange={(event) => setUrlDraft(event.target.value)}
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="shrink-0"
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
      </div>
    </Panel>
  )
}

export function EvidenceRow({
  evidence,
  onChangeAt,
}: {
  evidence: Evidence[]
  onChangeAt?: (index: number, patch: Partial<Evidence>) => void
}) {
  if (!evidence?.length) return null
  return (
    <div className="flex w-full min-w-0 flex-col gap-4 lg:flex-row lg:flex-wrap">
      {evidence.map((item, index) => (
        <div key={item.id} className="w-full min-w-0 lg:w-[calc(50%-0.5rem)]">
          <EvidenceCard
            evidence={item}
            onChange={onChangeAt ? (patch) => onChangeAt(index, patch) : undefined}
          />
        </div>
      ))}
    </div>
  )
}
