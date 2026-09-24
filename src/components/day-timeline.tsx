"use client"

import { useState } from "react"
import Link from "next/link"
import { timeBlockLabel } from "@/data/types"
import type { Day, Stop, TimeBlock } from "@/data/types"
import { Copy } from "@/components/layout-system"
import { repeats } from "@/lib/stop-facts"
import { PlanProposalDialog } from "@/components/plan-proposal-dialog"
import { BranchFinder } from "@/components/branch-finder"
import { useTrip } from "@/components/trip-provider"
import { Button } from "@/components/ui/button"
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

export function DayIntro({ day }: { day: Day }) {
  const { trip, applyProposal, revertImported } = useTrip()
  const [proposalOpen, setProposalOpen] = useState(false)
  const imported = (trip.planMode || "imported") === "imported"
  const proposal = trip.proposal
  const note = day.planNote || day.walkingNote
  const extra =
    day.planNote && day.walkingNote && !repeats(day.walkingNote, day.planNote)
      ? day.walkingNote
      : ""

  if (!note && !proposal) return null

  return (
    <div className="flex flex-col gap-3">
      {note ? <Copy>{note}</Copy> : null}
      {extra ? <Copy muted>{extra}</Copy> : null}
      {proposal ? (
        <div>
          <Button type="button" size="sm" variant="outline" onClick={() => setProposalOpen(true)}>
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
  )
}

export function DayTimeline({
  day,
  activeStopId,
  compact = false,
}: {
  day: Day
  activeStopId?: string
  compact?: boolean
}) {
  const groups = groupedStops(day.stops)

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      {day.stops.length === 0 ? (
        <p className="cjk-flow border-t border-border px-1 py-8 text-sm leading-7 text-muted-foreground">
          这一天还没有站点。回到首页粘贴圆周旅迹链接，或按天把地点加进去。
        </p>
      ) : (
        <div className="flex w-full min-w-0 flex-col gap-6">
          {groups.map((group) => (
            <section key={group.block} className="flex w-full min-w-0 flex-col">
              <p className="mb-1 text-[11px] font-medium text-muted-foreground">
                {group.block === "other" ? "行程" : timeBlockLabel[group.block]}
              </p>
              <ol className="flex flex-col">
                {group.items.map((stop) => {
                  const active = stop.id === activeStopId
                  return (
                    <li key={stop.id} className="min-w-0">
                      <Link
                        href={`/day/${day.id}/stop/${stop.id}`}
                        className={cn(
                          "grid w-full min-w-0 items-baseline gap-x-3 border-t border-border py-4 transition-colors hover:bg-muted/70",
                          compact
                            ? "grid-cols-[3.25rem_minmax(0,1fr)] px-2"
                            : "grid-cols-[3.25rem_2rem_minmax(0,1fr)] px-2",
                          active && "bg-secondary"
                        )}
                      >
                        <span
                          className={cn(
                            "text-sm tabular-nums",
                            active ? "text-primary" : "text-muted-foreground"
                          )}
                        >
                          {stop.arrive}
                        </span>
                        {compact ? null : (
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {String(stop.order).padStart(2, "0")}
                          </span>
                        )}
                        <span className="min-w-0">
                          <span className="cjk-flow block text-base leading-6 font-medium">
                            {stop.name}
                          </span>
                          {stop.optional ? (
                            <span className="cjk-flow mt-1 block text-sm leading-6 text-muted-foreground">
                              可选
                            </span>
                          ) : null}
                        </span>
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
