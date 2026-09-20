import { tokyoTrip } from "./tokyo"
import type { Day, Stop, Trip } from "./types"

/**
 * 当前使用的行程。
 * 换成真实圆周轨迹时：新增一份 `src/data/your-trip/`，并在此改成导出那份 Trip。
 */
export function getTrip(): Trip {
  return tokyoTrip
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

export function formatDayDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-")
  if (!year || !month || !day) return isoDate
  return `${Number(month)}月${Number(day)}日`
}

export type { Trip, Day, Stop } from "./types"
export { walkingLevelLabel } from "./types"
