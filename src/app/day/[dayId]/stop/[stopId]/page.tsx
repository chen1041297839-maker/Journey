import type { Metadata } from "next"
import { StopView } from "@/components/stop-view"
import { getDay, getDays, getStop } from "@/data"

type StopParams = { dayId: string; stopId: string }

export function generateStaticParams() {
  return getDays().flatMap((day) =>
    day.stops.map((stop) => ({ dayId: day.id, stopId: stop.id }))
  )
}

export const dynamicParams = true

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
    title: `${stop.name} · ${day.title} · Xenia 的行程站`,
    description: stop.note,
  }
}

export default async function StopPage({
  params,
}: {
  params: Promise<StopParams>
}) {
  const { dayId, stopId } = await params
  return <StopView dayId={dayId} stopId={stopId} />
}
