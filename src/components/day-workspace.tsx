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
    <div className="grid gap-6">
      <DayRouteMap day={day} />
      <div className="grid gap-8 lg:grid-cols-[minmax(280px,400px)_minmax(0,1fr)]">
        <aside className={cn(onStop ? "hidden lg:block" : "block")}>
          <DayTimeline day={day} activeStopId={activeStopId} />
        </aside>
        <div className={cn(onStop ? "block" : "hidden lg:block")}>{children}</div>
      </div>
    </div>
  )
}
