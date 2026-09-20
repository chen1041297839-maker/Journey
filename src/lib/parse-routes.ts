import type { DraftDay, DraftRoute, DraftStop } from "@/data/types"

const DAY_HEADER =
  /^(?:第\s*([0-9一二三四五六七八九十]+)\s*天|(?:day|d)\s*([0-9]{1,2}))(?:\s*[·:：\-—]\s*|\s+)?(.*)?$/i

const TIME_PREFIX = /^((?:[01]?\d|2[0-3])[:：][0-5]\d)\s+/

const CN_NUM: Record<string, number> = {
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
}

function parseDayNumber(raw: string): number | null {
  if (/^\d+$/.test(raw)) return Number(raw)
  if (CN_NUM[raw]) return CN_NUM[raw]
  return null
}

function asStop(line: string): DraftStop {
  const timeMatch = line.match(TIME_PREFIX)
  if (timeMatch) {
    return {
      raw: line,
      time: timeMatch[1].replace("：", ":"),
      name: line.slice(timeMatch[0].length).trim(),
    }
  }
  return { raw: line, name: line.replace(/^[\-•、]+\s*/, "") }
}

export function parseRouteText(text: string): DraftRoute {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))

  const days: DraftDay[] = []
  let current: DraftDay | null = null
  const loose: DraftStop[] = []

  for (const line of lines) {
    const header = line.match(DAY_HEADER)
    if (header) {
      const num = parseDayNumber(header[1] || header[2] || "")
      const label = (header[3] || "").trim()
      current = {
        dayNumber: num ?? days.length + 1,
        label: label || `第${num ?? days.length + 1}天`,
        stops: [],
      }
      days.push(current)
      continue
    }
    const stop = asStop(line)
    if (!stop.name) continue
    if (current) current.stops.push(stop)
    else loose.push(stop)
  }

  if (days.length === 0 && loose.length > 0) {
    return {
      days: [{ dayNumber: 1, label: "待排期", stops: loose }],
    }
  }

  if (loose.length > 0) {
    days.unshift({ dayNumber: 0, label: "未标注日期", stops: loose })
  }

  return { days: days.filter((day) => day.stops.length > 0) }
}

export function draftToText(route: DraftRoute): string {
  return route.days
    .map((day) => {
      const title = `第${day.dayNumber || 1}天 ${day.label}`.trim()
      const stops = day.stops
        .map((stop) => (stop.time ? `${stop.time} ${stop.name}` : stop.name))
        .join("\n")
      return `${title}\n${stops}`
    })
    .join("\n\n")
}

export function countStops(route: DraftRoute): number {
  return route.days.reduce((sum, day) => sum + day.stops.length, 0)
}
