"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { SAMPLE_ROUTE_TEXT } from "@/data/sample-route"
import type { DraftDay } from "@/data/types"
import { useTrip } from "@/components/trip-provider"
import { EmptyState } from "@/components/empty-state"
import { Copy, Heading, MetaLabel, Panel } from "@/components/layout-system"
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
  const [editing, setEditing] = useState(false)
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

  const hasTrip = !trip.isSampleRoute && trip.days.length > 0

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-3xl flex-1 flex-col gap-10 px-4 py-8 sm:px-6">
      {hasTrip ? (
        <section className="flex flex-col">
          <p className="text-sm text-muted-foreground">
            {trip.datesLabel} · {trip.days.length} 天 ·{" "}
            {trip.days.reduce((sum, day) => sum + day.stops.length, 0)} 站
          </p>
          <Heading as="h2" className="mt-2 text-3xl">
            {trip.destination}
          </Heading>
          <ol className="mt-8">
            {trip.days.map((day) => (
              <li key={day.id} className="border-t border-border">
                <button
                  type="button"
                  onClick={() => router.push(`/day/${day.id}`)}
                  className="grid w-full grid-cols-[3rem_minmax(0,1fr)] items-baseline gap-4 py-5 text-left transition-colors hover:bg-muted/70"
                >
                  <span className="text-sm tabular-nums text-primary">
                    {String(day.dayNumber).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="cjk-flow block text-lg leading-7 font-medium">{day.title}</span>
                    <span className="cjk-flow mt-1 block text-sm leading-6 text-muted-foreground">
                      {day.stops.length} 站
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button type="button" onClick={() => router.push(`/day/${trip.days[0].id}`)}>
              从第一天开始
            </Button>
            {trip.proposal ? (
              <Button type="button" variant="outline" onClick={() => setProposalOpen(true)}>
                {(trip.planMode || "imported") === "imported" ? "查看规划建议" : "规划建议 / 恢复原顺序"}
              </Button>
            ) : null}
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
      ) : (
        <header className="flex w-full min-w-0 flex-col gap-3">
          <MetaLabel>圆周旅迹导入</MetaLabel>
          <Heading as="h2" className="text-3xl">
            粘贴分享链接，按导入顺序打开
          </Heading>
        </header>
      )}

      {hasTrip && !editing ? (
        <button
          type="button"
          className="w-fit text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          onClick={() => setEditing(true)}
        >
          修改导入或手动粘贴
        </button>
      ) : (
        <div id="route-editor" className="flex flex-col gap-8 border-t border-border pt-6">
      <Panel>
        <label className="text-sm font-medium" htmlFor="pitravel-url">
          圆周旅迹分享链接
        </label>
        <Input
          id="pitravel-url"
          value={shareUrl}
          onChange={(event) => setShareUrl(event.target.value)}
          placeholder="https://www.pitravel.cn/web/journey/detail/…"
          className="w-full min-w-0 font-mono text-sm"
        />
        <Copy muted className="text-xs leading-6">
          在圆周旅迹打开行程 → 分享 → 复制链接。好友不登录也能打开的公开链接才能导入。
        </Copy>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={onImport} disabled={generating || !shareUrl.trim()}>
            {generating ? "正在导入…" : "导入行程"}
          </Button>
        </div>
      </Panel>

      <PostPaste />

      <div className="flex w-full min-w-0 flex-col gap-8 lg:flex-row lg:items-start">
        <section className="flex w-full min-w-0 flex-1 flex-col gap-3">
          <label className="text-sm font-medium" htmlFor="route-paste">
            或手动粘贴地点
          </label>
          <Textarea
            id="route-paste"
            value={text}
            onChange={(event) => syncFromText(event.target.value)}
            className="min-h-[280px] w-full min-w-0 font-mono text-sm"
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
            <p className="cjk-flow text-sm leading-7 text-destructive" role="alert">
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
            <Copy muted className="text-xs leading-6">
              已识别 {parsed.days.length} 天 · {stopCount} 站
              {text.trim() === SAMPLE_ROUTE_TEXT.trim()
                ? " · 当前是东京示例路线，生成后的笔记证据会标「示例」"
                : ""}
            </Copy>
          )}
        </section>

        <section className="flex w-full min-w-0 flex-col gap-4 lg:w-[22rem] lg:shrink-0">
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
            <Copy muted>导入或粘贴之后会在这里拆成按天的列表，也可以手动加站。</Copy>
          ) : null}
          <div className="flex w-full min-w-0 flex-col gap-4">
            {structured.map((day, dayIndex) => (
              <Panel key={`${day.dayNumber}-${dayIndex}`}>
                <p className="text-[11px] text-muted-foreground">
                  DAY {String(day.dayNumber || dayIndex + 1).padStart(2, "0")}
                </p>
                <Input
                  className="mt-1 w-full min-w-0"
                  value={day.label}
                  onChange={(event) => {
                    const next = structured.map((item, index) =>
                      index === dayIndex ? { ...item, label: event.target.value } : item
                    )
                    syncFromStructured(next)
                  }}
                />
                <ul className="flex w-full min-w-0 flex-col gap-2 text-sm">
                  {day.stops.map((stop, stopIndex) => (
                    <li
                      key={`${stop.name}-${stopIndex}`}
                      className="flex w-full min-w-0 items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2"
                    >
                      <span className="min-w-0 flex-1 leading-6">
                        {stop.time ? (
                          <span className="mr-2 tabular-nums text-muted-foreground">
                            {stop.time}
                          </span>
                        ) : null}
                        {stop.name}
                      </span>
                      <button
                        type="button"
                        className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
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
                  className="flex w-full min-w-0 gap-2"
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
                  <Button type="submit" size="sm" variant="secondary" className="shrink-0">
                    添加
                  </Button>
                </form>
              </Panel>
            ))}
          </div>
        </section>
      </div>
        </div>
      )}
    </main>
  )
}
