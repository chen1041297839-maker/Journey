"use client"

import { useState } from "react"
import Link from "next/link"
import { Camera, Clock3, ShoppingBag } from "lucide-react"
import { timeBlockLabel, walkingLevelLabel } from "@/data/types"
import type { Day, Stop, TimeBlock } from "@/data/types"
import { OutfitCard } from "@/components/outfit-card"
import { PlanProposalDialog } from "@/components/plan-proposal-dialog"
import { BranchFinder } from "@/components/branch-finder"
import { useTrip } from "@/components/trip-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { stopFactChips, stopFactLine } from "@/lib/stop-facts"
import { cn } from "@/lib/utils"

function groupedStops(stops: Stop[]): { block: TimeBlock | "other"; items: Stop[] }[] {
  const groups: { block: TimeBlock | "other"; items: Stop[] }[] = []
  for (const stop of stops) {
    const block = stop.timeBlock || "other"
    const last = groups.at(-1)
    if (last && last.block === block) last.items.push(stop)
    else groups.push({ block, items: [stop] })
  }
  return groups
}

export function DayTimeline({
  day,
  activeStopId,
}: {
  day: Day
  activeStopId?: string
}) {
  const { trip, applyProposal, revertImported } = useTrip()
  const [proposalOpen, setProposalOpen] = useState(false)
  const groups = groupedStops(day.stops)
  const imported = (trip.planMode || "imported") === "imported"
  const proposal = trip.proposal

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{imported ? "圆周旅迹原顺序" : "已采用规划建议"}</Badge>
          <Badge variant="secondary">{walkingLevelLabel[day.walkingLevel]}</Badge>
          <Badge variant="outline">{day.weatherVibe.split("，")[0]}</Badge>
        </div>
        <h2 className="mt-3 font-heading text-2xl leading-tight">{day.theme}</h2>
        {day.planNote ? (
          <p className="mt-2 text-pretty text-sm leading-relaxed text-foreground/90">{day.planNote}</p>
        ) : null}
        <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
          {day.walkingNote}
        </p>
        <p className="mt-2 text-sm text-foreground/80">
          街区气质 · {day.neighborhoodStyle}
        </p>
        <p className="mt-3 text-pretty text-xs text-muted-foreground">
          {day.routeSummary.join(" → ")}
        </p>
        {proposal ? (
          <div className="mt-3">
            <Button type="button" size="sm" variant={imported ? "outline" : "secondary"} onClick={() => setProposalOpen(true)}>
              {imported ? "查看规划建议" : "规划建议 / 恢复原顺序"}
            </Button>
            <PlanProposalDialog
              open={proposalOpen}
              onOpenChange={setProposalOpen}
              proposal={proposal}
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
          </div>
        ) : null}
      </div>

      <OutfitCard outfit={day.outfit} compact />
      <BranchFinder dayId={day.id} />

      {day.stops.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          这一天还没有站点。回到首页粘贴圆周旅迹链接，或按天把地点加进去。
        </p>
      ) : (
        <div className="grid gap-5">
          {groups.map((group) => (
            <section key={group.block}>
              <p className="mb-2 text-[11px] font-medium text-primary">
                {group.block === "other" ? "行程" : timeBlockLabel[group.block]}
              </p>
              <ol className="relative flex flex-col gap-3 border-l border-primary/30 pl-5">
                {group.items.map((stop) => {
                  const active = stop.id === activeStopId
                  return (
                    <li key={stop.id} className="relative">
                      <span
                        className={cn(
                          "absolute top-4 -left-[27px] size-3 rounded-full ring-4 ring-background",
                          active ? "bg-primary" : "bg-foreground/30"
                        )}
                      />
                      <Link
                        href={`/day/${day.id}/stop/${stop.id}`}
                        className={cn(
                          "block min-w-0 rounded-2xl border bg-card px-4 py-3 transition-colors",
                          active
                            ? "border-primary ring-1 ring-primary/30"
                            : "border-border hover:border-primary/40"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[11px] text-muted-foreground">
                              {String(stop.order).padStart(2, "0")} · {stop.area}
                              {stop.optional ? " · 可选" : ""}
                            </p>
                            <p className="mt-0.5 font-heading text-lg leading-tight break-normal">
                              {stop.name}
                            </p>
                          </div>
                          <span className="flex items-center gap-1 text-xs tabular-nums text-muted-foreground">
                            <Clock3 className="size-3.5" />
                            {stop.arrive}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-3 text-pretty text-sm leading-relaxed break-normal text-foreground">
                          {stopFactLine(stop)}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                          {stopFactChips(stop).map((chip) => (
                            <span key={chip} className="inline-flex items-center gap-1">
                              {chip.includes("机位") ? <Camera className="size-3" /> : null}
                              {chip.includes("店") ? <ShoppingBag className="size-3" /> : null}
                              {chip}
                            </span>
                          ))}
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="size-3" />
                            {stop.duration}
                          </span>
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
