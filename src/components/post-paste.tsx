"use client"

import { useState } from "react"
import { useTrip } from "@/components/trip-provider"
import { Copy, Heading, MetaLabel, Panel } from "@/components/layout-system"
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
    const lines = result.attached.map((item) => {
      const bits = [`已挂到「${item.stopName}」`]
      if (item.imageCount > 0) bits.push(`存了 ${item.imageCount} 张公开图`)
      if (item.ocrCount > 0) bits.push(`OCR ${item.ocrCount} 行`)
      if (item.partialRead) bits.push("网页读不全")
      return bits.join(" · ")
    })
    if (result.unmatched.length > 0) {
      lines.push(
        `${result.unmatched.length} 条没有匹配到站点。打开对应那一站再贴一次，或在链接旁写上店名。`
      )
    }
    setSummary(lines.join("\n") || "没有抽出新的要点。")
    if (result.attached.length > 0) setText("")
  }

  return (
    <Panel>
      <MetaLabel>小红书 / 抖音 / Instagram</MetaLabel>
      <Heading as="h3" className="text-lg">
        {stopId ? "把这一站的链接贴进来" : "把笔记链接贴在这里"}
      </Heading>
      <Copy muted>
        {stopId
          ? "这里只贴公开链接。截图请用上面的上传区，不要发到聊天。贴链接后自动：读公开页正文 → 下载能拿到的配图 → OCR → 写进要点。原帖只留小字「来源」。不会登录，也不会走 App。"
          : `这里只贴公开链接。清单截图请打开对应那一站，在网页上传区拖入或选择，不要发到聊天。贴链接后自动读公开页、存图、OCR。当前行程 ${trip.days.reduce((sum, day) => sum + day.stops.length, 0)} 站，能对上店名的会自动挂上。`}
      </Copy>
      <Textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        className="min-h-[132px] w-full min-w-0 font-mono text-sm"
        placeholder={"https://www.xiaohongshu.com/explore/…\nhttps://www.douyin.com/video/…\nhttps://www.instagram.com/p/…"}
        aria-label="小红书、抖音或 Instagram 公开链接"
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => void onSubmit()} disabled={generating || !text.trim()}>
          {generating ? "正在读取、存图、OCR…" : "读取并抽出要点"}
        </Button>
      </div>
      {localError ? (
        <p className="cjk-flow text-sm leading-7 text-destructive" role="alert">
          {localError}
        </p>
      ) : null}
      {summary ? (
        <p className="cjk-flow whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{summary}</p>
      ) : null}
    </Panel>
  )
}
