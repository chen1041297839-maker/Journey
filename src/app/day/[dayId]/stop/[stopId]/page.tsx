import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { StopDetail } from "@/components/stop-detail"
import { getDay, getDays, getStop } from "@/data"

type StopParams = { dayId: string; stopId: string }

export function generateStaticParams() {
  return getDays().flatMap((day) =>
    day.stops.map((stop) => ({ dayId: day.id, stopId: stop.id }))
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<StopParams>
}): Promise<Metadata> {
  const { dayId, stopId } = await params
  const day = getDay(dayId)
  const stop = getStop(dayId, stopId)
  if (!day || !stop) return { title: "找不到这一站" }
  return {
    title: `${stop.name} · ${day.title} · Hologrow 的东京手帐`,
    description: stop.note,
  }
}

export default async function StopPage({
  params,
}: {
  params: Promise<StopParams>
}) {
  const { dayId, stopId } = await params
  const day = getDay(dayId)
  const stop = getStop(dayId, stopId)
  if (!day || !stop) notFound()
  return <StopDetail day={day} stop={stop} />
}
