import type { CatalogDay, CatalogOutfit, CatalogStop } from "@/data/catalog"
import {
  areaClusterOrder,
  catalogDayByNumber,
  matchPlace,
} from "@/data/place-library"
import { SAMPLE_ROUTE_TEXT } from "@/data/sample-route"
import type {
  Day,
  DraftDay,
  DraftRoute,
  DraftStop,
  Evidence,
  MustBuy,
  Outfit,
  PhotoSpot,
  Shop,
  Stop,
  Trip,
  WalkingLevel,
} from "@/data/types"
import { platformForSeed, sampleEvidence } from "@/lib/evidence"
import { parseRouteText } from "@/lib/parse-routes"
import type { PitravelImportResult } from "@/lib/pitravel"
import { stopFromDraft } from "@/lib/stop-templates"

const TRAVELER = "Xenia"

export type PlanOptions = {
  sourceText?: string
  isSampleRoute?: boolean
  startDate?: string
  destination?: string
  title?: string
  intro?: string
  sourceNote?: string
  id?: string
  datesLabel?: string
}

function weekdayLabel(iso: string): string {
  const date = new Date(`${iso}T12:00:00`)
  return ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][date.getDay()]
}

function addDays(iso: string, offset: number): string {
  const date = new Date(`${iso}T12:00:00`)
  date.setDate(date.getDate() + offset)
  return date.toISOString().slice(0, 10)
}

function formatRange(start: string, end: string): string {
  const [, sm, sd] = start.split("-")
  const [, em, ed] = end.split("-")
  return `${Number(sm)}.${Number(sd)} – ${Number(em)}.${Number(ed)}`
}

function minutesFromDuration(duration: string): number {
  const hour = duration.match(/(\d+(?:\.\d+)?)\s*小时/)
  if (hour) return Math.round(Number(hour[1]) * 60)
  const min = duration.match(/(\d+)\s*分钟/)
  if (min) return Number(min[1])
  return 75
}

function formatArrive(totalMinutes: number): string {
  const clamped = Math.max(7 * 60 + 30, Math.min(20 * 60, totalMinutes))
  const h = Math.floor(clamped / 60)
  const m = clamped % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

function toShop(shop: CatalogStop["shops"][number], seed: string): Shop {
  const platform = platformForSeed(seed)
  return {
    ...shop,
    evidence: [
      sampleEvidence(
        `${seed}-shop`,
        platform,
        `${shop.name}｜店内怎么逛`,
        `${shop.note} 找：${shop.whatToLookFor}`
      ),
    ],
  }
}

function toMustBuy(item: CatalogStop["mustBuys"][number], seed: string): MustBuy {
  const platform = platformForSeed(`${seed}-buy`)
  return {
    ...item,
    evidence: [
      sampleEvidence(
        `${seed}-buy`,
        platform,
        `必买｜${item.name}`,
        `${item.reason} ${item.tip}`
      ),
    ],
  }
}

function toPhotoSpot(
  spot: CatalogStop["photoSpots"][number],
  seed: string,
  refs: CatalogStop["xhsRefs"]
): PhotoSpot {
  const platform = platformForSeed(`${seed}-spot`)
  const ref = refs[0]
  const quote = ref
    ? `${ref.poseTips} ${ref.outfitNotes}`
    : `${spot.standWhere} ${spot.angle}`
  return {
    ...spot,
    evidence: [
      sampleEvidence(
        `${seed}-spot`,
        platform,
        ref?.caption || `${spot.title}｜机位`,
        quote
      ),
    ],
  }
}

function toOutfit(outfit: CatalogOutfit, seed: string, refs: CatalogStop["xhsRefs"] = []): Outfit {
  const evidence: Evidence[] = refs.slice(0, 2).map((ref, index) =>
    sampleEvidence(
      `${seed}-outfit-${index}`,
      platformForSeed(`${seed}-outfit-${index}`),
      ref.caption,
      `${ref.outfitNotes} ${ref.poseTips}`
    )
  )
  if (evidence.length === 0) {
    evidence.push(
      sampleEvidence(
        `${seed}-outfit`,
        platformForSeed(`${seed}-outfit`),
        `当日穿搭｜${outfit.summary}`,
        outfit.why
      )
    )
  }
  return { ...outfit, evidence }
}

function outfitForDay(label: string, areas: string[], walking: WalkingLevel): CatalogOutfit {
  const joined = `${label} ${areas.join(" ")}`
  if (/机场|出发/.test(joined)) {
    return {
      summary: "舒服登机：柔软上身 + 不皱的裤子 + 好脱的鞋。",
      pieces: ["棉质上衣", "直筒裤", "薄外套备一件"],
      why: "返程日几乎不走路，衣服要能过安检、飞机上不皱。",
      shoes: "好脱的运动鞋",
      bag: "登机小包，证件单独一层",
      colors: ["米白", "浅灰"],
      avoid: "金属太多的配饰、新鞋",
    }
  }
  if (/梯田|小七孔|峡谷|景区|民俗/.test(joined) || walking === "heavy") {
    return {
      summary: "能走路的户外一套：防晒衣 + 速干裤 + 旧运动鞋。",
      pieces: ["防晒衣或薄外套", "速干或直筒裤", "帽子", "已经穿过的运动鞋"],
      why: "贵州景区内台阶多、水汽重，浅色会脏，鞋必须抓地。",
      shoes: "旧运动鞋，鞋底别新到打滑",
      bag: "双肩小包，手要空出来拍照",
      colors: ["雾绿", "卡其", "米白"],
      avoid: "新鞋、白裙拖地、高跟鞋",
    }
  }
  if (/侗寨|黔东南|堂安|肇兴/.test(joined)) {
    return {
      summary: "寨子散步：棉麻上身 + 直筒裤 + 能爬坡的鞋。",
      pieces: ["棉麻衬衫或针织", "直筒裤", "薄外套"],
      why: "鼓楼和梯田间高差大，衣服要能爬、也要能进民宿院子拍照。",
      shoes: "抓地的运动鞋",
      bag: "斜挎小包，别背大手提",
      colors: ["靛蓝", "亚麻", "木色"],
      avoid: "恨天高、容易刮到的长裙",
    }
  }
  if (/拍照|逛吃|贵阳|市集/.test(joined)) {
    return {
      summary: "贵阳 citywalk：浅色上衣 + 直筒裤 + 已经穿过的鞋。",
      pieces: ["浅色上衣", "直筒裤或宽裤", "薄外套", "小耳饰"],
      why: "巷子、市集和肠旺面蒸汽都要入画，颜色干净但不怕油烟。",
      shoes: "旧运动鞋",
      bag: "单肩小包，手要空出来拍照",
      colors: ["米白", "浅卡其", "砖红"],
      avoid: "新鞋、不便走路的高跟鞋",
    }
  }
  if (/待计划|备选/.test(joined)) {
    return {
      summary: "备选日：按天气再加减一件的舒适套。",
      pieces: ["透气上衣", "直筒裤", "薄外套"],
      why: "这些点还没排进正日子，先按能走路来准备。",
      shoes: "旧运动鞋",
      bag: "轻便斜挎",
      colors: ["米白", "雾蓝"],
      avoid: "新鞋",
    }
  }
  return {
    summary: "落地轻松一套：透气上衣 + 宽松裤 + 旧运动鞋。",
    pieces: ["透气上衣", "直筒裤或宽裤", "薄外套"],
    why: "按当天站点的步行量和街区气质来。等你补真实穿搭笔记。",
    shoes: "旧运动鞋",
    bag: "单肩小包，手要空出来拍照",
    colors: ["米白", "靛蓝"],
    avoid: "新鞋、不便走路的高跟鞋",
  }
}

function fromCatalog(catalog: CatalogStop, order: number, arrive: string): Stop {
  const seed = catalog.id
  return {
    id: catalog.id,
    order,
    name: catalog.name,
    nameJa: catalog.nameJa,
    area: catalog.area,
    arrive,
    duration: catalog.duration,
    vibe: catalog.vibe,
    note: catalog.note,
    shops: catalog.shops.map((shop) => toShop(shop, `${seed}-${shop.id}`)),
    mustBuys: catalog.mustBuys.map((item) => toMustBuy(item, `${seed}-${item.id}`)),
    photoSpots: catalog.photoSpots.map((spot) =>
      toPhotoSpot(spot, `${seed}-${spot.id}`, catalog.xhsRefs)
    ),
  }
}

function resolveStop(draft: DraftStop, order: number, clock: number): { stop: Stop; nextClock: number } {
  const matched = matchPlace(draft.name)
  const catalog = matched?.stop
  const arrive = draft.time || formatArrive(clock)
  const stop = catalog
    ? fromCatalog(catalog, order, arrive)
    : stopFromDraft(draft, order, arrive)
  stop.arrive = arrive
  const nextClock = clock + minutesFromDuration(stop.duration) + 15
  return { stop, nextClock }
}

function clusterUnlabeled(stops: DraftStop[]): DraftDay[] {
  const decorated = stops.map((draft) => {
    const place = matchPlace(draft.name)
    return {
      draft,
      order: place?.clusterOrder ?? areaClusterOrder(place?.area || "") + 50,
      area: place?.area || draft.area || "待归类",
    }
  })
  decorated.sort((a, b) => a.order - b.order)

  const days: DraftDay[] = []
  let bucket: typeof decorated = []
  let lastArea = ""

  const flush = () => {
    if (bucket.length === 0) return
    const areas = Array.from(new Set(bucket.map((item) => item.area)))
    days.push({
      dayNumber: days.length + 1,
      label: areas.slice(0, 2).join(" · "),
      stops: bucket.map((item) => item.draft),
    })
    bucket = []
  }

  for (const item of decorated) {
    const areaChanged = lastArea && item.area !== lastArea && bucket.length >= 2
    if (bucket.length >= 4 || areaChanged) flush()
    bucket.push(item)
    lastArea = item.area
  }
  flush()
  return days
}

function walkingLevel(stopCount: number): WalkingLevel {
  if (stopCount <= 2) return "light"
  if (stopCount <= 4) return "moderate"
  return "heavy"
}

function buildDay(draft: DraftDay, index: number, startDate: string): Day {
  const dayNumber = draft.dayNumber > 0 ? draft.dayNumber : index + 1
  const date = addDays(startDate, index)
  let clock = 8 * 60
  const stops: Stop[] = []
  for (const [stopIndex, draftStop] of draft.stops.entries()) {
    const resolved = resolveStop(draftStop, stopIndex + 1, clock)
    clock = resolved.nextClock
    stops.push(resolved.stop)
  }

  const areas = stops.map((stop) => stop.area)
  const uniqueAreas = areas.filter((area, i) => areas.indexOf(area) === i && area !== "待归类")
  const tokyoHits = draft.stops
    .map((item) => matchPlace(item.name))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
  const catalog: CatalogDay | undefined =
    tokyoHits.length > 0 && tokyoHits.length >= Math.ceil(draft.stops.length / 2)
      ? catalogDayByNumber(tokyoHits[0]?.outfitFromDay || dayNumber)
      : undefined
  const refs = catalog?.stops.flatMap((stop) => stop.xhsRefs) ?? []
  const level = walkingLevel(stops.length)
  const outfit = toOutfit(
    catalog?.outfit ?? outfitForDay(draft.label, uniqueAreas, level),
    `day-${dayNumber}`,
    refs
  )

  return {
    id: `d${dayNumber}`,
    dayNumber,
    date,
    weekday: weekdayLabel(date),
    title: draft.label && draft.label !== "待排期" ? draft.label : uniqueAreas[0] || `第${dayNumber}天`,
    theme: `${uniqueAreas.join(" → ") || "行程"}，按片区排好，少走回头路。`,
    weatherVibe: catalog?.weatherVibe || "贵州天气善变，薄外套随身",
    walkingLevel: level,
    walkingNote:
      catalog?.walkingNote ||
      (level === "heavy" ? "站点多，中午必须坐下来吃一顿。" : "节奏适中，给机位留出停留时间。"),
    neighborhoodStyle: catalog?.neighborhoodStyle || uniqueAreas.join("、") || draft.label,
    routeSummary: stops.map((stop) => stop.name),
    outfit,
    stops,
  }
}

export function planItinerary(route: DraftRoute, options?: PlanOptions): Trip {
  const startDate = options?.startDate ?? "2026-10-16"
  const unlabeled = route.days.length === 1 && route.days[0].label === "待排期"
  const daysSource = unlabeled ? clusterUnlabeled(route.days[0].stops) : route.days
  const days = daysSource.map((draft, index) => buildDay(draft, index, startDate))
  const scheduled = days.filter((day) => !/待计划|备选/.test(day.title))
  const endDate = scheduled.at(-1)?.date ?? days.at(-1)?.date ?? startDate
  const wishlistDate = endDate
  const normalized = days.map((day) =>
    /待计划|备选/.test(day.title)
      ? { ...day, date: wishlistDate, weekday: weekdayLabel(wishlistDate) }
      : day
  )
  const inferred =
    normalized.flatMap((day) => day.stops.map((stop) => stop.area)).find((area) => area !== "待归类") ||
    "行程"

  return {
    id: options?.id || `xenia-trip-${startDate}`,
    traveler: TRAVELER,
    title: options?.title || "Xenia 的行程站",
    destination: options?.destination || inferred,
    datesLabel: options?.datesLabel || formatRange(startDate, endDate),
    startDate,
    endDate,
    intro:
      options?.intro ||
      "把圆周旅迹链接或路线贴进来，站点会按片区排好。每一站补上店、必买、机位和当天穿搭，并附上笔记证据（图 + 来源）。",
    sourceNote:
      options?.sourceNote ||
      "不会登录或抓取小红书、抖音、Instagram。示例卡片带「示例」标记；真实出行请换成你自己的链接、配图或 Instagram 官方 embed。",
    sourceText: options?.sourceText ?? "",
    isSampleRoute: Boolean(options?.isSampleRoute),
    days: normalized,
  }
}

export function planFromText(text: string, isSampleRoute = false): Trip {
  return planItinerary(parseRouteText(text), { sourceText: text, isSampleRoute })
}

export function planFromPitravel(result: PitravelImportResult): Trip {
  return planItinerary(result.draft, {
    id: result.meta.id ? `xenia-pitravel-${result.meta.id}` : undefined,
    sourceText: result.sourceText,
    isSampleRoute: false,
    startDate: result.meta.startDate,
    destination: result.meta.destination,
    title: result.meta.name || "Xenia 的行程站",
    datesLabel: result.meta.timeDescription || undefined,
    intro: `${result.meta.destination} · ${result.meta.timeDescription || "已导入日程"}。按圆周旅迹里的顺序排期，每一站补上店、必买、机位和当天穿搭。`,
    sourceNote: `从圆周旅迹导入：${result.meta.shareUrl}${
      result.meta.timeDescription ? ` · ${result.meta.timeDescription}` : ""
    }。店、必买、机位按地点类型生成；笔记证据标了示例。不会抓取小红书、抖音、Instagram。`,
  })
}

export function defaultSampleTrip(): Trip {
  return planFromText(SAMPLE_ROUTE_TEXT, true)
}
