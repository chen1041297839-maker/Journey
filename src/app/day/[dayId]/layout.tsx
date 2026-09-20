import { notFound } from "next/navigation"
import type { Metadata } from "next"
import type { ReactNode } from "react"
import { DaySwitcher } from "@/components/day-switcher"
import { DayWorkspace } from "@/components/day-workspace"
import { SourceNote } from "@/components/trip-header"
import { getDay, getDays } from "@/data"

type DayParams = { dayId: string }

export function generateStaticParams() {
  return getDays().map((day) => ({ dayId: day.id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<DayParams>
}): Promise<Metadata> {
  const { dayId } = await params
  const day = getDay(dayId)
  if (!day) return { title: "找不到这一天" }
  return {
    title: `${day.title} · Hologrow 的东京手帐`,
    description: day.theme,
  }
}

export default async function DayLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<DayParams>
}) {
  const { dayId } = await params
  const day = getDay(dayId)
  if (!day) notFound()

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <DaySwitcher days={getDays()} activeDayId={day.id} />
      <DayWorkspace day={day}>{children}</DayWorkspace>
      <SourceNote className="pb-8" />
    </div>
  )
}
