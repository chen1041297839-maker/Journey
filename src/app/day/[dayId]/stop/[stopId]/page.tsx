"use client"

import { use } from "react"
import { EmptyState } from "@/components/empty-state"
import { JournalSkeleton } from "@/components/journal-skeleton"
import { StopDetail } from "@/components/stop-detail"
import { useTrip } from "@/components/trip-provider"

type StopParams = { dayId: string; stopId: string }

export default function StopPage({ params }: { params: Promise<StopParams> }) {
  const { dayId, stopId } = use(params)
  const { trip, ready } = useTrip()
  if (!ready) return <JournalSkeleton />

  const day = trip.days.find((item) => item.id === dayId)
  const stop = day?.stops.find((item) => item.id === stopId)
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
