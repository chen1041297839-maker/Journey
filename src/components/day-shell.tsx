"use client"

import type { ReactNode } from "react"
import { DaySwitcher } from "@/components/day-switcher"
import { DayWorkspace } from "@/components/day-workspace"
import { JournalSkeleton } from "@/components/journal-skeleton"
import { EmptyState } from "@/components/empty-state"
import { useTrip } from "@/components/trip-provider"

export function DayShell({
  dayId,
  children,
}: {
  dayId: string
  children: ReactNode
}) {
  const { trip, ready } = useTrip()
  if (!ready) return <JournalSkeleton />

  const day = trip.days.find((item) => item.id === dayId)
  if (!day) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-16">
        <EmptyState
          title="找不到这一天"
          description="当前行程里没有这一天。回到首页打开已导入的路线，或重新粘贴圆周旅迹链接。"
        />
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col gap-8 px-4 pb-16 sm:px-6">
      <DaySwitcher days={trip.days} activeDayId={day.id} />
      <DayWorkspace day={day}>{children}</DayWorkspace>
    </div>
  )
}
