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
import { applyResearchedEvidence, applyResearchedOutfit, researchedOutfitEvidence } from "@/lib/research"
import { describePlanChanges, planWalkableDays, preserveImportedDays } from "@/lib/plan-walk"
import { uniqueStopId } from "@/lib/stop-id"
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
  importedOrder?: boolean
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
    warnings: [],
  }
}

function resolveStop(
  draft: DraftStop,
  order: number,
  clock: number,
  dayNumber: number,
  usedIds: Set<string>
): { stop: Stop; nextClock: number } {
  const matched = matchPlace(draft.name)
  const catalog = matched?.stop
  const arrive = draft.time || formatArrive(clock)
  const stableId = uniqueStopId(dayNumber, catalog?.name || draft.name, usedIds)
  const stop = catalog
    ? { ...fromCatalog(catalog, order, arrive), id: stableId }
    : stopFromDraft(draft, order, arrive, stableId)
  stop.arrive = arrive
  const parts = arrive.split(":").map(Number)
  const arriveMinutes =
    Number.isFinite(parts[0]) && Number.isFinite(parts[1]) ? parts[0] * 60 + parts[1] : clock
  const nextClock = arriveMinutes + minutesFromDuration(stop.duration) + 15
  stop.timeBlock = draft.timeBlock
  stop.optional = draft.optional
  if (draft.optional) {
    stop.note = `${stop.note} 这一站要打车，不排进主线步行。`.trim()
  }
  return { stop: applyResearchedEvidence(stop), nextClock }
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

function walkingLevel(stops: Stop[]): WalkingLevel {
  const countable = stops.filter((stop) => !stop.optional && !/酒店|民宿|客栈|溪宿/.test(stop.name))
  if (countable.length <= 2) return "light"
  if (countable.length <= 4) return "moderate"
  return "heavy"
}

function buildDay(draft: DraftDay, index: number, startDate: string, importedOrder = false): Day {
  const dayNumber = draft.dayNumber > 0 ? draft.dayNumber : index + 1
  const date = addDays(startDate, index)
  let clock = 8 * 60
  const stops: Stop[] = []
  const usedIds = new Set<string>()
  for (const [stopIndex, draftStop] of draft.stops.entries()) {
    const resolved = resolveStop(draftStop, stopIndex + 1, clock, dayNumber, usedIds)
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
  const level = walkingLevel(stops)
  const outfit = toOutfit(
    catalog?.outfit ?? outfitForDay(draft.label, uniqueAreas, level),
    `day-${dayNumber}`,
    refs
  )
  const researched = researchedOutfitEvidence(
    `${draft.label} ${stops.map((stop) => stop.name).join(" ")}`,
    `day-${dayNumber}`
  )
  const realFromStops = Array.from(
    new Map(
      stops
        .flatMap((stop) => [
          ...stop.shops.flatMap((shop) => shop.evidence),
          ...stop.mustBuys.flatMap((item) => item.evidence),
          ...stop.photoSpots.flatMap((spot) => spot.evidence),
        ])
        .filter((item) => !item.isSample)
        .map((item) => [item.url, item])
    ).values()
  )
  if (researched.length > 0) {
    outfit.evidence = [...researched, ...outfit.evidence.filter((item) => !item.isSample)]
  } else if (realFromStops.length > 0) {
    outfit.evidence = realFromStops.slice(0, 3)
  }
  const outfitLabel = `${draft.label} ${stops.map((stop) => stop.name).join(" ")}`
  const dressed = applyResearchedOutfit(outfit, outfitLabel, `day-${dayNumber}`)

  const mainStops = stops.filter((stop) => !stop.optional)
  const title =
    draft.label && draft.label !== "待排期" ? draft.label : uniqueAreas[0] || `第${dayNumber}天`

  return {
    id: `d${dayNumber}`,
    dayNumber,
    date,
    weekday: weekdayLabel(date),
    title,
    theme: importedOrder
      ? `${uniqueAreas.join(" → ") || "行程"} · 圆周旅迹原顺序`
      : `${uniqueAreas.join(" → ") || "行程"} · 已采用规划建议`,
    weatherVibe: catalog?.weatherVibe || "贵州天气善变，薄外套随身",
    walkingLevel: level,
    walkingNote:
      catalog?.walkingNote ||
      (importedOrder
        ? "按导入顺序走。若要改片区穿插、回酒店或日落时机，先看规划建议。"
        : level === "heavy"
          ? "主线站点多，按时间块走，可选点随时砍。"
          : "按片区排好，给机位留出停留。"),
    neighborhoodStyle: catalog?.neighborhoodStyle || uniqueAreas.join("、") || draft.label,
    routeSummary: mainStops.map((stop) => stop.name),
    planNote: draft.planNote,
    rawStopNames: draft.rawStopNames,
    outfit: dressed,
    stops,
  }
}

export function planItinerary(route: DraftRoute, options?: PlanOptions): Trip {
  const startDate = options?.startDate ?? "2026-10-16"
  const unlabeled = route.days.length === 1 && route.days[0].label === "待排期"
  const daysSource = unlabeled ? clusterUnlabeled(route.days[0].stops) : route.days
  const importedOrder = Boolean(options?.importedOrder)
  const days = daysSource.map((draft, index) => buildDay(draft, index, startDate, importedOrder))
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
      "把圆周旅迹链接贴进来。默认按导入顺序显示每一站抽出的店、必买、机位、穿搭和避坑。原帖只留来源。规划建议要你确认后才会改顺序。",
    sourceNote:
      options?.sourceNote ||
      "系统会公开检索小红书 / 抖音 / Instagram，并读取你粘贴的链接（公开页或 oEmbed）。抽出店、必买、机位、价格和避坑；原帖只留来源。评论网页读不到也会标明。不会登录，也不会走 App 接口。",
    sourceText: options?.sourceText ?? "",
    isSampleRoute: Boolean(options?.isSampleRoute),
    days: normalized,
  }
}

export function planFromText(text: string, isSampleRoute = false): Trip {
  return planItinerary(parseRouteText(text), { sourceText: text, isSampleRoute })
}

export function planFromPitravel(result: PitravelImportResult): Trip {
  const importedDraft = preserveImportedDays(result.draft.days)
  const suggestedDraft = planWalkableDays(result.draft.days)
  const shared = {
    id: result.meta.id ? `xenia-pitravel-${result.meta.id}` : undefined,
    sourceText: result.sourceText,
    isSampleRoute: false,
    startDate: result.meta.startDate,
    destination: result.meta.destination,
    title: result.meta.name || "Xenia 的行程站",
    datesLabel: result.meta.timeDescription || undefined,
  }
  const importedTrip = planItinerary(
    { days: importedDraft },
    {
      ...shared,
      importedOrder: true,
      intro: `${result.meta.destination} · ${result.meta.timeDescription || "已导入日程"}。默认按圆周旅迹原顺序。每一站先看抽出来的店、必买、机位、价格和避坑；原帖只留来源链接。规划建议要你确认后才会改这一天。`,
      sourceNote: `从圆周旅迹导入：${result.meta.shareUrl}${
        result.meta.timeDescription ? ` · ${result.meta.timeDescription}` : ""
      }。导入顺序是准绳，不会悄悄重排。小红书 / 抖音 / Instagram 只抽要点，不把原帖当主界面。评论不在公开页就标「评论网页读不到」。不会登录，也不会走 App 接口。`,
    }
  )
  const suggestedTrip = planItinerary(
    { days: suggestedDraft },
    {
      ...shared,
      importedOrder: false,
      intro: importedTrip.intro,
      sourceNote: importedTrip.sourceNote,
    }
  )
  const changes = describePlanChanges(importedDraft, suggestedDraft)
  return {
    ...importedTrip,
    planMode: "imported",
    proposal:
      changes.length > 0
        ? {
            summary: `有 ${changes.length} 处和导入顺序不同（片区穿插、回酒店占站、日落时机等）。默认仍按圆周旅迹。只有点「采用建议」后才会改。`,
            changes,
            importedDays: importedTrip.days,
            suggestedDays: suggestedTrip.days,
          }
        : undefined,
  }
}

export function defaultSampleTrip(): Trip {
  return planFromText(SAMPLE_ROUTE_TEXT, true)
}
