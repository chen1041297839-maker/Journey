import type { Metadata } from "next"
import type { ReactNode } from "react"
import { DayShell } from "@/components/day-shell"
import { getDay, getDays } from "@/data"

type DayParams = { dayId: string }

export function generateStaticParams() {
  return getDays().map((day) => ({ dayId: day.id }))
}

export const dynamicParams = true

export async function generateMetadata({
  params,
}: {
  params: Promise<DayParams>
}): Promise<Metadata> {
  const { dayId } = await params
  const day = getDay(dayId)
  if (!day) return { title: "找不到这一天" }
  return {
    title: `${day.title} · Xenia 的行程站`,
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
  return <DayShell dayId={dayId}>{children}</DayShell>
}
