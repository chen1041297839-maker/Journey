"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import type { Day } from "@/data/types"
import { BranchFinder } from "@/components/branch-finder"
import { DayIntro, DayTimeline } from "@/components/day-timeline"
import { DayRouteMap } from "@/components/day-route-map"

export function DayWorkspace({
  day,
  children,
}: {
  day: Day
  children: ReactNode
}) {
  const pathname = usePathname()
  const activeStopId = pathname.match(/\/stop\/([^/]+)/)?.[1]

  if (activeStopId) {
    return (
      <div className="flex w-full min-w-0 flex-col gap-8 lg:flex-row lg:items-start">
        <aside className="hidden w-64 shrink-0 lg:sticky lg:top-14 lg:block">
          <DayTimeline day={day} activeStopId={activeStopId} compact />
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-8">
      <DayRouteMap day={day} />
      <DayIntro day={day} />
      <DayTimeline day={day} />
      <BranchFinder dayId={day.id} />
    </div>
  )
}
