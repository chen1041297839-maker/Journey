"use client"

import { useState } from "react"
import { useTrip } from "@/components/trip-provider"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export function PostPaste({
  stopId,
  dayId,
}: {
  stopId?: string
  dayId?: string
}) {
  const { importPosts, generating, trip } = useTrip()
  const [text, setText] = useState("")
  const [summary, setSummary] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  async function onSubmit() {
    setLocalError(null)
    const result = await importPosts(text, { stopId, dayId })
    if (!result) return
    const lines = result.attached.map(
      (item) =>
        `已挂到「${item.stopName}」${item.partialRead ? " · 网页读不全" : ""}`
    )
    if (result.unmatched.length > 0) {
      lines.push(
        `${result.unmatched.length} 条没有匹配到站点。打开对应那一站再贴一次，或在链接旁写上店名。`
      )
    }
    setSummary(lines.join("\n") || "没有新的卡片。")
    if (result.attached.length > 0) setText("")
  }

  return (
    <section className="grid gap-3 rounded-2xl border border-border bg-card p-4">
      <div>
        <p className="text-[11px] tracking-[0.16em] text-primary">笔记链接</p>
        <h3 className="mt-1 font-heading text-lg">
          {stopId ? "把这一站的帖子贴进来" : "粘贴小红书 / 抖音 / Instagram 链接"}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          只读公开页和 Instagram oEmbed，不会登录、也不会走 App 接口。打不开就保存链接并标「网页读不全」。
          {stopId
            ? ""
            : ` 当前行程 ${trip.days.reduce((sum, day) => sum + day.stops.length, 0)} 站，能对上店名的会自动挂上。`}
        </p>
      </div>
      <Textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        className="min-h-[120px] font-mono text-sm"
        placeholder={"https://www.xiaohongshu.com/explore/…\nhttps://www.douyin.com/video/…\nhttps://www.instagram.com/p/…"}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => void onSubmit()} disabled={generating || !text.trim()}>
          {generating ? "正在读取公开页…" : "读取并挂上证据"}
        </Button>
      </div>
      {localError ? (
        <p className="text-sm text-destructive" role="alert">
          {localError}
        </p>
      ) : null}
      {summary ? (
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{summary}</p>
      ) : null}
    </section>
  )
}
