import importedJourney from "@/data/imported/pitravel-7662387918598377796.json"
import type { Day, Stop, Trip } from "./types"
import { parsePitravelPayload, XENIA_SHARE_URL } from "@/lib/pitravel"
import { planFromPitravel } from "@/lib/plan-itinerary"

/**
 * 默认行程：Xenia 从圆周旅迹分享链接导入的贵州路线。
 * 首页仍可粘贴其他公开分享链接，或手动排期。
 */
export function getTrip(): Trip {
  const result = parsePitravelPayload(importedJourney, XENIA_SHARE_URL)
  return planFromPitravel(result)
}

export function getDays(): Day[] {
  return getTrip().days
}

export function getDay(dayId: string): Day | undefined {
  return getDays().find((day) => day.id === dayId)
}

export function getStop(dayId: string, stopId: string): Stop | undefined {
  return getDay(dayId)?.stops.find((stop) => stop.id === stopId)
}

export function getDefaultDayId(): string | undefined {
  return getDays()[0]?.id
}

export type { Trip, Day, Stop } from "./types"
export { walkingLevelLabel, timeBlockLabel } from "./types"
export { formatDayDate } from "@/lib/format-date"
