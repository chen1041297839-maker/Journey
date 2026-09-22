"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import type { Day } from "@/data/types"
import { DayTimeline } from "@/components/day-timeline"
import { DayRouteMap } from "@/components/day-route-map"
import { cn } from "@/lib/utils"

export function DayWorkspace({
  day,
  children,
}: {
  day: Day
  children: ReactNode
}) {
  const pathname = usePathname()
  const stopMatch = pathname.match(/\/stop\/([^/]+)/)
  const activeStopId = stopMatch?.[1]
  const onStop = Boolean(activeStopId)

  return (
    <div className="flex w-full min-w-0 flex-col gap-8">
      <DayRouteMap day={day} />
      <div className="flex w-full min-w-0 flex-col gap-8 lg:flex-row lg:items-start">
        <aside className={cn("w-full min-w-0 lg:w-[22rem] lg:shrink-0", onStop ? "hidden lg:block" : "block")}>
          <DayTimeline day={day} activeStopId={activeStopId} />
        </aside>
        <div className={cn("w-full min-w-0 flex-1", onStop ? "block" : "hidden lg:block")}>{children}</div>
      </div>
    </div>
  )
}
