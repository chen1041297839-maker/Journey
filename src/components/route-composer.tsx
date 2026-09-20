"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { SAMPLE_ROUTE_TEXT } from "@/data/sample-route"
import type { DraftDay } from "@/data/types"
import { useTrip } from "@/components/trip-provider"
import { EmptyState } from "@/components/empty-state"
import { PlanProposalDialog } from "@/components/plan-proposal-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PostPaste } from "@/components/post-paste"
import { XENIA_SHARE_URL } from "@/lib/pitravel"
import { countStops, draftToText, parseRouteText } from "@/lib/parse-routes"

export function RouteComposer() {
  const router = useRouter()
  const { generate, importShare, generating, error, trip, applyProposal, revertImported } = useTrip()
  const [shareUrl, setShareUrl] = useState(XENIA_SHARE_URL)
  const [text, setText] = useState(
    trip.isSampleRoute ? SAMPLE_ROUTE_TEXT : trip.sourceText || ""
  )
  const [structured, setStructured] = useState<DraftDay[]>(() =>
    parseRouteText(trip.isSampleRoute ? SAMPLE_ROUTE_TEXT : trip.sourceText || "").days
  )
  const [proposalOpen, setProposalOpen] = useState(false)
  const [stopDraft, setStopDraft] = useState<Record<number, string>>({})
  const parsed = useMemo(() => parseRouteText(text), [text])
  const stopCount = countStops(parsed)

  function syncFromText(next: string) {
    setText(next)
    setStructured(parseRouteText(next).days)
  }

  function syncFromStructured(days: DraftDay[]) {
    setStructured(days)
    setText(draftToText({ days }))
  }

  async function onImport() {
    const result = await importShare(shareUrl.trim() || XENIA_SHARE_URL)
    if (result?.days[0]) {
      setText(result.sourceText)
      setStructured(parseRouteText(result.sourceText).days)
      router.push(`/day/${result.days[0].id}`)
    }
  }

  async function onGenerate(isSample = false) {
    const result = await generate(text, isSample)
    if (result?.days[0]) router.push(`/day/${result.days[0].id}`)
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      <div className="max-w-2xl">
        <p className="text-[11px] tracking-[0.2em] text-primary">圆周旅迹导入</p>
        <h2 className="mt-2 font-heading text-3xl leading-tight">
          粘贴分享链接，按导入顺序打开
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          圆周旅迹的站点顺序是准绳，导入后不会悄悄重排。若规划认为某一天在片区之间折返、回酒店占站、或日落时机不合理，会弹出确认框：改什么、为什么、保持原顺序还是采用建议。店、必买、机位、穿搭仍会挂上公开检索和你粘贴的小红书 / 抖音 / Instagram 帖子。打不开就标「网页读不全」。不会登录，也不会走 App 接口。
        </p>
      </div>

      {!trip.isSampleRoute && trip.days.length > 0 ? (
        <section className="rounded-2xl border border-border bg-card px-4 py-4 sm:px-5">
          <p className="text-[11px] tracking-[0.16em] text-muted-foreground">当前行程</p>
          <p className="mt-1 font-heading text-xl">
            {trip.title} · {trip.destination}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {trip.datesLabel} · {trip.days.length} 天 ·{" "}
            {trip.days.reduce((sum, day) => sum + day.stops.length, 0)} 站
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" onClick={() => router.push(`/day/${trip.days[0].id}`)}>
              打开行程
            </Button>
            {trip.proposal ? (
              <Button type="button" variant="outline" onClick={() => setProposalOpen(true)}>
                {(trip.planMode || "imported") === "imported" ? "查看规划建议" : "规划建议 / 恢复原顺序"}
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={onImport} disabled={generating}>
              {generating ? "正在导入…" : "重新导入当前链接"}
            </Button>
          </div>
          {trip.proposal ? (
            <PlanProposalDialog
              open={proposalOpen}
              onOpenChange={setProposalOpen}
              proposal={trip.proposal}
              planMode={trip.planMode || "imported"}
              onKeep={() => setProposalOpen(false)}
              onApply={() => {
                applyProposal()
                setProposalOpen(false)
              }}
              onRevert={() => {
                revertImported()
                setProposalOpen(false)
              }}
            />
          ) : null}
        </section>
      ) : null}

      <section className="grid gap-3 rounded-2xl border border-primary/30 bg-card p-4 sm:p-5">
        <label className="text-sm font-medium" htmlFor="pitravel-url">
          圆周旅迹分享链接
        </label>
        <Input
          id="pitravel-url"
          value={shareUrl}
          onChange={(event) => setShareUrl(event.target.value)}
          placeholder="https://www.pitravel.cn/web/journey/detail/…"
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          在圆周旅迹打开行程 → 分享 → 复制链接。好友不登录也能打开的公开链接才能导入。
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={onImport} disabled={generating || !shareUrl.trim()}>
            {generating ? "正在导入…" : "导入行程"}
          </Button>
        </div>
      </section>

      {!trip.isSampleRoute ? <PostPaste /> : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
        <section className="grid gap-3">
          <label className="text-sm font-medium" htmlFor="route-paste">
            或手动粘贴地点
          </label>
          <Textarea
            id="route-paste"
            value={text}
            onChange={(event) => syncFromText(event.target.value)}
            className="min-h-[280px] font-mono text-sm"
            placeholder={"第1天 贵阳\n谷莫尼酒店\n玉珍酸笋火锅"}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onGenerate(false)}
              disabled={generating}
            >
              {generating ? "正在排期…" : "按粘贴文本生成"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                syncFromText(SAMPLE_ROUTE_TEXT)
              }}
            >
              填入东京示例（仅演示）
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                syncFromText(SAMPLE_ROUTE_TEXT)
                void onGenerate(true)
              }}
            >
              用示例直接生成
            </Button>
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          {stopCount === 0 ? (
            <EmptyState
              className="py-10"
              title="还没有站点"
              description="优先粘贴圆周旅迹分享链接。也可以从备忘录复制一天或一整段路线，或在右侧按天添加地点。"
            />
          ) : (
            <p className="text-xs text-muted-foreground">
              已识别 {parsed.days.length} 天 · {stopCount} 站
              {text.trim() === SAMPLE_ROUTE_TEXT.trim()
                ? " · 当前是东京示例路线，生成后的笔记证据会标「示例」"
                : ""}
            </p>
          )}
        </section>

        <section className="grid gap-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-heading text-lg">按天整理</h3>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                syncFromStructured([
                  ...structured,
                  {
                    dayNumber: structured.length + 1,
                    label: `第${structured.length + 1}天`,
                    stops: [],
                  },
                ])
              }
            >
              加一天
            </Button>
          </div>
          {structured.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              导入或粘贴之后会在这里拆成按天的列表，也可以手动加站。
            </p>
          ) : null}
          <div className="grid gap-4">
            {structured.map((day, dayIndex) => (
              <div
                key={`${day.dayNumber}-${dayIndex}`}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <p className="text-[11px] tracking-[0.16em] text-muted-foreground">
                  DAY {String(day.dayNumber || dayIndex + 1).padStart(2, "0")}
                </p>
                <Input
                  className="mt-2"
                  value={day.label}
                  onChange={(event) => {
                    const next = structured.map((item, index) =>
                      index === dayIndex ? { ...item, label: event.target.value } : item
                    )
                    syncFromStructured(next)
                  }}
                />
                <ul className="mt-3 grid gap-1.5 text-sm">
                  {day.stops.map((stop, stopIndex) => (
                    <li
                      key={`${stop.name}-${stopIndex}`}
                      className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-2 py-1.5"
                    >
                      <span>
                        {stop.time ? (
                          <span className="mr-2 tabular-nums text-muted-foreground">
                            {stop.time}
                          </span>
                        ) : null}
                        {stop.name}
                      </span>
                      <button
                        type="button"
                        className="text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          const next = structured.map((item, index) =>
                            index === dayIndex
                              ? {
                                  ...item,
                                  stops: item.stops.filter((_, i) => i !== stopIndex),
                                }
                              : item
                          )
                          syncFromStructured(next)
                        }}
                      >
                        去掉
                      </button>
                    </li>
                  ))}
                </ul>
                <form
                  className="mt-3 flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault()
                    const name = (stopDraft[dayIndex] || "").trim()
                    if (!name) return
                    const next = structured.map((item, index) =>
                      index === dayIndex
                        ? { ...item, stops: [...item.stops, { raw: name, name }] }
                        : item
                    )
                    syncFromStructured(next)
                    setStopDraft((current) => ({ ...current, [dayIndex]: "" }))
                  }}
                >
                  <Input
                    value={stopDraft[dayIndex] || ""}
                    placeholder="添加地点，例如 堂安梯田"
                    onChange={(event) =>
                      setStopDraft((current) => ({
                        ...current,
                        [dayIndex]: event.target.value,
                      }))
                    }
                  />
                  <Button type="submit" size="sm" variant="secondary">
                    添加
                  </Button>
                </form>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
