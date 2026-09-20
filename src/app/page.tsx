import { redirect } from "next/navigation"
import { EmptyState } from "@/components/empty-state"
import { getDefaultDayId, getTrip } from "@/data"

export default function Home() {
  const trip = getTrip()
  const dayId = getDefaultDayId()

  if (!dayId || trip.days.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-16">
        <EmptyState
          title="还没有行程"
          description="把圆周轨迹里的日程按 Day 和 Stop 填进 src/data，保存后这里就会出现按天切换的手帐。"
        />
      </main>
    )
  }

  redirect(`/day/${dayId}`)
}
