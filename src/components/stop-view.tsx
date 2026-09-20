"use client"

import { EmptyState } from "@/components/empty-state"
import { JournalSkeleton } from "@/components/journal-skeleton"
import { StopDetail } from "@/components/stop-detail"
import { useTrip } from "@/components/trip-provider"

function decodeSegment(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function StopView({ dayId, stopId }: { dayId: string; stopId: string }) {
  const { trip, ready } = useTrip()
  if (!ready) return <JournalSkeleton />

  const decodedDayId = decodeSegment(dayId)
  const decodedStopId = decodeSegment(stopId)
  const day = trip.days.find((item) => item.id === decodedDayId)
  const stop = day?.stops.find(
    (item) => item.id === decodedStopId || decodeSegment(item.id) === decodedStopId
  )
  if (!day || !stop) {
    return (
      <EmptyState
        title="找不到这一站"
        description="这一站不在当前行程里。回到时间线再点一次，或重新导入圆周旅迹链接。"
      />
    )
  }

  return <StopDetail day={day} stop={stop} />
}
