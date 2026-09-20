import type { DraftDay, DraftRoute, DraftStop } from "@/data/types"

export const XENIA_SHARE_URL =
  "https://www.pitravel.cn/web/journey/detail/7662387918598377796?lang=zh-Hans&source=copyLink"

export const XENIA_JOURNEY_ID = "7662387918598377796"

const PITRAVEL_HOSTS = new Set(["www.pitravel.cn", "pitravel.cn", "api.pitravel.cn"])

export type PitravelJourneyMeta = {
  id: string
  name: string
  timeDescription: string
  destination: string
  startDate?: string
  shareUrl: string
  poiCount?: number
}

export type PitravelImportResult = {
  meta: PitravelJourneyMeta
  draft: DraftRoute
  sourceText: string
}

type SlimEvent = {
  name?: string
  event_type?: number
  category?: string
  city?: string
  address?: string
  image?: string
  note?: string
  is_transport?: boolean
  start_poi_info?: {
    name?: string
    address?: string
    image?: string
    category?: { display_name?: string; level1?: string }[]
    political_info?: { name?: string; political_level?: number }[]
  }
  transport_info?: unknown
}

type SlimDay = {
  day_index?: number
  day_plan_name?: string
  remark?: string
  timestamp?: number
  cities?: string[]
  bind_political_info?: { name?: string }[]
  events?: SlimEvent[]
}

type SlimJourney = {
  id?: string | number
  name?: string
  time_description?: string
  days?: number
  start_time?: number
  poi_count?: number
  share_url?: string
  bind_political_info?: { name?: string; political_level?: number }[]
  day_plans?: SlimDay[]
}

export function isPitravelInput(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (/^\d{6,}$/.test(trimmed)) return true
  if (/pitravel\.cn/i.test(trimmed)) return true
  try {
    const url = new URL(trimmed)
    return url.hostname.endsWith("pitravel.cn") || PITRAVEL_HOSTS.has(url.hostname)
  } catch {
    return false
  }
}

export function extractJourneyId(input: string): string | null {
  const trimmed = input.trim()
  if (/^\d{6,}$/.test(trimmed)) return trimmed
  try {
    const url = new URL(trimmed)
    if (!url.hostname.endsWith("pitravel.cn")) return null
    const fromQuery = url.searchParams.get("journey_id")
    if (fromQuery && /^\d+$/.test(fromQuery)) return fromQuery
    const path = url.pathname.match(/\/(?:web\/)?journey\/(?:detail\/)?(\d{6,})/)
    if (path?.[1]) return path[1]
    return null
  } catch {
    const loose = trimmed.match(/pitravel\.cn\/web\/journey\/detail\/(\d{6,})/i)
    return loose?.[1] ?? null
  }
}

export function officialDetailUrl(journeyId: string): string {
  return `https://www.pitravel.cn/api/slytherin/v1/web/journey/detail?journey_id=${journeyId}`
}

export function officialShareUrl(journeyId: string): string {
  return `https://www.pitravel.cn/web/journey/detail/${journeyId}?lang=zh-Hans&source=copyLink`
}

function cityFromEvent(event: SlimEvent): string {
  if (event.city) return event.city
  const infos = event.start_poi_info?.political_info || []
  const prefecture = infos.find((item) => item.political_level === 3)
  return prefecture?.name || ""
}

function categoryFromEvent(event: SlimEvent): string {
  if (event.category) return event.category
  const cat = event.start_poi_info?.category?.[0]
  return cat?.display_name || cat?.level1 || ""
}

function eventName(event: SlimEvent): string {
  return (event.start_poi_info?.name || event.name || "").trim()
}

function isTransport(event: SlimEvent): boolean {
  if (event.is_transport) return true
  if (event.transport_info) return true
  const type = event.event_type ?? 0
  return type === 201 || type === 202 || type === 203 || type === 204
}

function isoFromTimestamp(ms?: number): string | undefined {
  if (!ms) return undefined
  const date = new Date(ms)
  const shifted = new Date(date.getTime() + 8 * 60 * 60 * 1000)
  return shifted.toISOString().slice(0, 10)
}

function destinationFromJourney(journey: SlimJourney): string {
  const fromPolitics =
    journey.bind_political_info?.find((item) => item.political_level === 2)?.name ||
    journey.bind_political_info?.find((item) => item.political_level === 3)?.name
  if (fromPolitics) return fromPolitics
  if (journey.name && /贵州/.test(journey.name)) return "贵州省"
  const cities = (journey.day_plans || []).flatMap((plan) => plan.cities || [])
  if (cities.some((city) => /贵阳|黔东南|黔南|贵州|荔波|肇兴|安顺|毕节/.test(city))) {
    return "贵州省"
  }
  return cities[0] || journey.name || "行程"
}

function unwrapJourney(payload: unknown): SlimJourney | null {
  if (!payload || typeof payload !== "object") return null
  const root = payload as Record<string, unknown>
  if (root.day_plans) return root as SlimJourney
  const data = root.data
  if (data && typeof data === "object") {
    const journey = (data as Record<string, unknown>).journey
    if (journey && typeof journey === "object") return journey as SlimJourney
  }
  const journey = root.journey
  if (journey && typeof journey === "object") return journey as SlimJourney
  return null
}

export function parsePitravelPayload(
  payload: unknown,
  shareUrl?: string
): PitravelImportResult {
  const journey = unwrapJourney(payload)
  if (!journey?.day_plans?.length) {
    throw new Error("这份分享里没有可解析的日程。")
  }

  const destination = destinationFromJourney(journey)

  const scheduled: DraftDay[] = []
  let wishlist: DraftDay | null = null

  for (const plan of journey.day_plans) {
    const cities = plan.cities?.length
      ? plan.cities
      : (plan.bind_political_info || []).map((item) => item.name).filter(Boolean) as string[]
    const stops: DraftStop[] = []
    let last = ""
    for (const event of plan.events || []) {
      if (isTransport(event)) continue
      const name = eventName(event)
      if (!name || name === last) continue
      last = name
      stops.push({
        raw: name,
        name,
        area: cityFromEvent(event) || cities[0],
        category: categoryFromEvent(event),
        note: event.note || plan.remark || "",
        imageSrc: (event.image || event.start_poi_info?.image || "").split("?")[0] || undefined,
      })
    }
    if (stops.length === 0) continue
    const labelParts = [plan.day_plan_name, plan.remark].filter(Boolean)
    const day: DraftDay = {
      dayNumber: plan.day_index && plan.day_index > 0 ? plan.day_index : scheduled.length + 1,
      label: labelParts.join(" · ") || `第${scheduled.length + 1}天`,
      stops,
    }
    if (plan.day_index === -1 || plan.day_plan_name === "待计划") {
      wishlist = { ...day, dayNumber: 99, label: plan.remark || "待计划 · 备选" }
    } else {
      scheduled.push(day)
    }
  }

  const days = wishlist ? [...scheduled, { ...wishlist, dayNumber: scheduled.length + 1 }] : scheduled
  if (days.length === 0) throw new Error("分享里的地点都无法识别。")

  const meta: PitravelJourneyMeta = {
    id: String(journey.id || ""),
    name: journey.name || "导入的行程",
    timeDescription: journey.time_description || "",
    destination,
    startDate: isoFromTimestamp(journey.start_time),
    shareUrl: shareUrl || journey.share_url || officialShareUrl(String(journey.id || "")),
    poiCount: journey.poi_count,
  }

  const sourceText = days
    .map((day) => `第${day.dayNumber}天 ${day.label}\n${day.stops.map((stop) => stop.name).join("\n")}`)
    .join("\n\n")

  return { meta, draft: { days }, sourceText }
}

export function pitravelErrorMessage(code: unknown, msg: unknown): string {
  const text = typeof msg === "string" ? msg : ""
  if (code === -15001 || text.includes("未公开")) {
    return "这份行程未公开。请在圆周旅迹里打开分享 → 复制链接，并确认好友不登录也能打开。"
  }
  if (code === -15002 || text.includes("不存在")) {
    return "找不到这份行程，链接可能过期或 ID 写错了。"
  }
  if (text.includes("失效") || text.includes("过期")) {
    return "分享链接已失效，请在 App 里重新复制一次。"
  }
  if (text.includes("登录") || text.includes("登陆")) {
    return "这份分享需要登录才能看。请改成公开复制链接，或改用手动粘贴地点。"
  }
  return text || "圆周旅迹没有返回行程数据。"
}
