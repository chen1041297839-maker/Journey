import mappedCatalog from "@/data/research/mapped-places.json"
import type {
  Day,
  Evidence,
  GeoPoint,
  MapPick,
  MustBuy,
  OcrLine,
  PhotoSpot,
  Shop,
  Stop,
  Trip,
  Warning,
} from "@/data/types"
import { cleanTripCopy } from "@/lib/cjk-text"
import { detourKm, haversineKm, roundKm, walkMinutes, type LngLat } from "@/lib/geo"

export type MappedBranch = {
  name: string
  address: string
  lat: number
  lng: number
  system: GeoPoint["system"]
}

export type MappedPlace = {
  id: string
  name: string
  aliases?: string[]
  category: string
  meal?: string
  prefer?: string[]
  hours?: string
  note: string
  whatToLookFor?: string
  mustBuy?: { name: string; reason: string; budget: string; tip: string }
  warning?: { kind: "雷" | "注意"; text: string }
  ocrLines?: OcrLine[]
  sourceCaption?: string
  sourceUrl?: string
  uncertain?: boolean
  attachShop?: boolean
  branches?: MappedBranch[]
}

type CatalogFile = { places: MappedPlace[] }

const catalog = mappedCatalog as CatalogFile

export const STOP_COORDS: Record<string, GeoPoint> = {
  "谷莫尼 |MOSEN•叠翠墨岚酒店(甲秀楼青云市集大剧院店)": {
    lat: 26.565159,
    lng: 106.717779,
    system: "GCJ-02",
    address: "贵阳市南明区瑞金南路388号",
  },
  "玉珍酸笋火锅(喷水池店)": {
    lat: 26.582735,
    lng: 106.71355,
    system: "GCJ-02",
    address: "贵阳市云岩区青禾路慈善巷",
  },
  "亨特CITY MALL": {
    lat: 26.576099,
    lng: 106.719922,
    system: "GCJ-02",
    address: "贵阳市南明区文昌南路33号",
  },
  "蒋家肠旺面(青云路总店)": {
    lat: 26.565922,
    lng: 106.714872,
    system: "GCJ-02",
    address: "贵阳市南明区瑞金南路309号",
  },
  "青云市集": {
    lat: 26.564177,
    lng: 106.715094,
    system: "GCJ-02",
    address: "贵阳市南明区青云路83号",
  },
  "贵阳广播电视台": {
    lat: 26.567295,
    lng: 106.710209,
    system: "GCJ-02",
    address: "贵阳市南明区遵义路15号",
  },
  "花屿(花果园店)": {
    lat: 26.567467,
    lng: 106.686299,
    system: "GCJ-02",
    address: "贵阳市南明区花果园一期",
  },
  "民生路好吃街": {
    lat: 26.57938,
    lng: 106.716503,
    system: "GCJ-02",
    address: "贵阳市云岩区民生路10号",
  },
  电台街: { lat: 26.580024, lng: 106.718517, system: "GCJ-02", address: "贵阳市云岩区电台街" },
  堰塘街: { lat: 26.581947, lng: 106.716801, system: "GCJ-02", address: "贵阳市云岩区堰塘街" },
  省府北街: { lat: 26.581792, lng: 106.715455, system: "GCJ-02", address: "贵阳市云岩区省府北街" },
  圆通街: { lat: 26.582678, lng: 106.71509, system: "GCJ-02", address: "贵阳市云岩区圆通街" },
  杨记烤肉: {
    lat: 26.587017,
    lng: 106.704755,
    system: "GCJ-02",
    address: "贵阳市云岩区瑞金北路128号附4号",
  },
  "六广门毛阿姨糯米饭(沙河街店)": {
    lat: 26.592226,
    lng: 106.710376,
    system: "GCJ-02",
    address: "贵阳市云岩区沙河街138号",
  },
  小七孔景区: {
    lat: 25.252959,
    lng: 107.705723,
    system: "GCJ-02",
    address: "荔波县小七孔镇景区路6号",
  },
  "肇兴半山小筑民宿(堂安侗寨店)": {
    lat: 25.902843,
    lng: 109.212948,
    system: "GCJ-02",
    address: "黎平县厦格梯田附近",
  },
  "肇兴侗寨-鼓楼群": {
    lat: 25.906101,
    lng: 109.183632,
    system: "GCJ-02",
    address: "黎平县肇兴侗寨内(东侧)",
  },
  花椒树下餐饮店: {
    lat: 25.906075,
    lng: 109.18265,
    system: "GCJ-02",
    address: "肇兴镇肇兴村中寨四组",
  },
  堂安梯田: {
    lat: 25.900142,
    lng: 109.214237,
    system: "GCJ-02",
    address: "黎平县肇兴镇堂安村堂安侗寨",
  },
  牛棚咖啡屋: {
    lat: 25.899034,
    lng: 109.215161,
    system: "GCJ-02",
    address: "堂安村2组日落余晖民宿右侧",
  },
  猎人部落蜡染店: {
    lat: 25.90653,
    lng: 109.182737,
    system: "GCJ-02",
    address: "肇兴镇肇兴农商银行隔壁",
  },
  侗家火锅: { lat: 25.906813, lng: 109.181075, system: "GCJ-02", address: "肇兴村五组" },
  "瑶家土菜馆": {
    lat: 25.2485,
    lng: 107.7088,
    system: "GCJ-02",
    address: "荔波县小七孔景区附近",
  },
  贵阳龙洞堡国际机场: {
    lat: 26.537812,
    lng: 106.805223,
    system: "GCJ-02",
    address: "南明区机场路1号",
  },
}

export type PlacePick = {
  dayId: string
  dayTitle: string
  stopId: string
  stopName: string
  extraKm: number
  extraMin: number
  distanceKm: number
  branchName: string
  address: string
  location?: GeoPoint
  why: string
}

function hashCode(value: string): number {
  let hash = 0
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return Math.abs(hash)
}

function normName(value: string): string {
  return value.replace(/[（）()\s]/g, "").replace(/(店|摊)$/g, "")
}

export function namesMatch(a: string, b: string): boolean {
  const na = normName(a)
  const nb = normName(b)
  if (!na || !nb) return false
  if (na === nb) return true
  return na.includes(nb) || nb.includes(na)
}

function matchesPlace(name: string, place: MappedPlace): boolean {
  return [place.name, ...(place.aliases || [])].some((alias) => namesMatch(name, alias))
}

function asPoint(value: GeoPoint | MappedBranch): LngLat {
  return { lat: value.lat, lng: value.lng }
}

function isHotel(stop: Stop): boolean {
  return /酒店|民宿|客栈|溪宿|半山小筑/.test(stop.name)
}

function isWishlist(day: Day): boolean {
  return /待计划|备选/.test(day.title)
}

function regionOf(place: MappedPlace): "guiyang" | "zhaoxing" | "tangan" | "libo" {
  const blob = `${place.id} ${place.name} ${(place.prefer || []).join(" ")} ${place.note}`
  if (/小七孔|荔波|瑶家|板吉/.test(blob)) return "libo"
  if (/堂安|牛棚|一颗豆子|侗味集|落日余晖/.test(blob)) return "tangan"
  if (/肇兴|鼓楼|寨头|鱼爱牛|松子酥|猎人|花椒|侗家|廖胖子|蜡染|醉第|鱼王|蓝头巾|一杯黔|佳杰/.test(blob)) {
    return "zhaoxing"
  }
  return "guiyang"
}

function dayFits(day: Day, region: ReturnType<typeof regionOf>): boolean {
  if (isWishlist(day)) return false
  const blob = `${day.title} ${day.theme} ${day.stops.map((stop) => stop.name).join(" ")}`
  if (region === "tangan") return /堂安|牛棚|半山/.test(blob)
  if (region === "zhaoxing") return /肇兴|鼓楼|花椒|猎人|侗家|堂安/.test(blob)
  if (region === "libo") return /小七孔|瑶家|荔波/.test(blob)
  return /贵阳|喷水池|青云|亨特|民生|蒋家|杨记|毛阿姨/.test(blob) && !/小七孔|肇兴|堂安/.test(day.title)
}

function preferBonus(stop: Stop, prefer: string[]): number {
  const blob = `${stop.id} ${stop.name} ${stop.area} ${stop.vibe}`
  let score = 0
  for (const token of prefer) {
    if (!token) continue
    if (blob.includes(token)) {
      if (!(token === "青云" && /蒋家/.test(blob))) score += 1
    }
    if (token === "夜宵" && /杨记|烤肉|市集/.test(blob)) score += 0.9
    if (token === "喷水池" && /玉珍|喷水池/.test(blob)) score += 0.9
    if (token === "八鸽岩" && /玉珍|喷水池/.test(blob)) score += 1
    if (token === "落地" && /玉珍/.test(blob)) score += 0.6
    if (token === "寨头" && /鼓楼/.test(blob)) score += 0.8
    if (token === "友谊路" && /杨记|圆通|玉珍|民生/.test(blob)) score += 0.8
    if (token === "花果园" && /花屿|花果园/.test(blob)) score += 1.3
    if (token === "民生路" && /民生/.test(blob)) score += 1.3
    if (token === "青云" && /青云市集/.test(blob)) score += 1.3
    if (token === "陕西路" && /玉珍|民生|喷水池/.test(blob)) score += 0.7
    if (token === "亨特" && /亨特/.test(blob)) score += 1.3
    if (token === "小七孔" && /小七孔/.test(blob)) score += 1.4
    if (token === "瑶家" && /瑶家/.test(blob)) score += 1.2
    if (token === "东门" && /小七孔/.test(blob)) score += 0.4
    if (token === "蒋家" && /蒋家/.test(blob)) score += 1.4
  }
  return score
}

function skipForMeal(stop: Stop, meal?: string): boolean {
  if (meal === "夜宵" && /毛阿姨|糯米/.test(stop.name)) return true
  if (meal === "早餐" && /杨记|烤肉|市集/.test(stop.name)) return true
  return false
}

function slotDetour(stops: Stop[], index: number, poi?: LngLat): number {
  if (!poi) return 0
  const current = stops[index]?.location
  if (!current) return 0
  const next = stops.slice(index + 1).find((stop) => stop.location && !isHotel(stop))
  if (!next?.location) return haversineKm(asPoint(current), poi)
  return detourKm(asPoint(current), asPoint(next.location), poi)
}

export function pickStopForPlace(
  trip: Trip,
  place: MappedPlace,
  branch?: MappedBranch
): PlacePick | null {
  const region = regionOf(place)
  const poi = branch ? asPoint(branch) : undefined
  const prefer = place.prefer || []
  type Candidate = PlacePick & { score: number }
  const scored: Candidate[] = []

  for (const day of trip.days) {
    if (!dayFits(day, region)) continue
    for (const [index, stop] of day.stops.entries()) {
      if (isHotel(stop) && !prefer.some((token) => /住宿|民宿/.test(token))) continue
      if (skipForMeal(stop, place.meal)) continue
      const distanceKm = poi && stop.location ? haversineKm(asPoint(stop.location), poi) : 1.6
      const extraKm = slotDetour(day.stops, index, poi)
      const bonus = preferBonus(stop, prefer)
      const score = distanceKm + extraKm * 0.45 - bonus
      const extraMin = walkMinutes(Math.max(distanceKm, extraKm))
      scored.push({
        dayId: day.id,
        dayTitle: day.title,
        stopId: stop.id,
        stopName: stop.name,
        extraKm: roundKm(extraKm),
        extraMin,
        distanceKm: roundKm(distanceKm),
        branchName: branch?.name || "未钉死分店",
        address: branch?.address || "",
        location: branch
          ? { lat: branch.lat, lng: branch.lng, system: branch.system, address: branch.address }
          : undefined,
        why: "",
        score,
      })
    }
  }

  scored.sort((a, b) => a.score - b.score)
  const best = scored[0]
  if (!best) return null
  const whyParts = [
    branch ? `${branch.name}${branch.address ? `（${branch.address}）` : ""}` : "公开地址未钉死分店",
    `挂在「${best.stopName}」`,
    best.location ? `距该站约 ${best.distanceKm} 公里` : "按已定路线语义就近",
    best.extraKm > 0.2 ? `插进前后站大约多走 ${best.extraKm} 公里 / ${best.extraMin} 分钟` : "几乎不绕路",
    "不新增站点、不改圆周旅迹顺序",
  ]
  if (prefer.includes("青云") && !/青云/.test(best.stopName) && region === "guiyang") {
    whyParts.push("青云市集不在这条分店的最短路上，所以没挂青云")
  }
  return { ...best, why: whyParts.join("。") + "。" }
}

function evidenceFor(place: MappedPlace, stopId: string): Evidence {
  return {
    id: `map-${place.id}-${stopId}`,
    platform: "xiaohongshu",
    url: place.sourceUrl || `xenia://mapped/${place.id}`,
    caption: place.sourceCaption || place.name,
    quote: place.note,
    imageSrc: "",
    imageAlt: place.name,
    isSample: false,
    collectedBy: place.sourceUrl ? "paste" : "upload",
    commentsGated: true,
    partialRead: !place.sourceUrl,
  }
}

function uniquePush(list: Evidence[], item: Evidence): Evidence[] {
  if (list.some((entry) => entry.url === item.url && entry.caption === item.caption)) return list
  return [item, ...list.filter((entry) => !entry.isSample)]
}

function mergeOcr(current?: OcrLine[], extra?: OcrLine[]): OcrLine[] | undefined {
  if (!extra?.length) return current
  const next = [...(current ?? [])]
  for (const line of extra) {
    if (next.some((item) => item.text === line.text)) continue
    next.push(line)
  }
  return next
}

function mergePick(current: MapPick | undefined, next: MapPick): MapPick {
  return current && current.why.length >= next.why.length ? current : next
}

function toMapPick(pick: PlacePick): MapPick {
  return {
    branchName: pick.branchName,
    extraKm: pick.extraKm,
    extraMin: pick.extraMin,
    nearStopName: pick.stopName,
    why: pick.why,
  }
}

function upsertShop(stop: Stop, place: MappedPlace, pick: PlacePick, evidence: Evidence): Stop {
  if (place.attachShop === false) return stop
  const mapPick = toMapPick(pick)
  const existing = stop.shops.find((shop) => matchesPlace(shop.name, place))
  if (existing) {
    return {
      ...stop,
      shops: stop.shops.map((shop) =>
        shop.id === existing.id
          ? {
              ...shop,
              note: place.note || shop.note,
              hours: place.hours || shop.hours,
              whatToLookFor: place.whatToLookFor || shop.whatToLookFor,
              evidence: uniquePush(shop.evidence, evidence),
              ocrLines: mergeOcr(shop.ocrLines, place.ocrLines),
              uncertain: shop.uncertain || place.uncertain,
              location: pick.location || shop.location,
              mapPick: mergePick(shop.mapPick, mapPick),
            }
          : shop
      ),
    }
  }
  const created: Shop = {
    id: `${stop.id}-shop-${hashCode(place.name)}`,
    name: place.name,
    category: place.category,
    hours: place.hours || "以现场为准",
    note: place.note,
    whatToLookFor: place.whatToLookFor || place.name,
    evidence: [evidence],
    ocrLines: place.ocrLines,
    uncertain: place.uncertain,
    location: pick.location,
    mapPick,
  }
  const kept = stop.shops.filter((shop) => !/沿街小店|附近摊位|游客中心/.test(shop.name))
  return { ...stop, shops: [...kept, created] }
}

function upsertBuy(stop: Stop, place: MappedPlace, pick: PlacePick, evidence: Evidence): Stop {
  const spec = place.mustBuy
  if (!spec) return stop
  const mapPick = toMapPick(pick)
  const existing = stop.mustBuys.find(
    (item) => matchesPlace(item.name, place) || namesMatch(item.name, spec.name)
  )
  if (existing) {
    return {
      ...stop,
      mustBuys: stop.mustBuys.map((item) =>
        item.id === existing.id
          ? {
              ...item,
              name: /松子酥/.test(item.name) || /松子酥/.test(spec.name) ? "鱼爱牛松子酥" : item.name,
              reason: spec.reason || item.reason,
              budget: spec.budget || item.budget,
              tip: spec.tip || item.tip,
              evidence: uniquePush(item.evidence, evidence),
              ocrLines: mergeOcr(item.ocrLines, place.ocrLines),
              uncertain: item.uncertain || place.uncertain,
              mapPick: mergePick(item.mapPick, mapPick),
            }
          : item
      ),
    }
  }
  const created: MustBuy = {
    id: `${stop.id}-buy-${hashCode(spec.name)}`,
    name: spec.name,
    reason: spec.reason,
    budget: spec.budget,
    tip: spec.tip,
    evidence: [evidence],
    ocrLines: place.ocrLines,
    uncertain: place.uncertain,
    mapPick,
  }
  return {
    ...stop,
    mustBuys: [...stop.mustBuys.filter((item) => !item.evidence.every((card) => card.isSample)), created],
  }
}

function upsertWarning(stop: Stop, place: MappedPlace): Stop {
  const warning = place.warning
  if (!warning) return stop
  if ((stop.warnings ?? []).some((item) => item.text === warning.text || namesMatch(item.text, warning.text))) {
    return stop
  }
  const created: Warning = {
    id: `${stop.id}-warn-${hashCode(warning.text)}`,
    text: warning.text,
    kind: warning.kind,
  }
  return { ...stop, warnings: [...(stop.warnings ?? []), created] }
}

function pushFlag(stop: Stop, flag: string): Stop {
  const flags = stop.readFlags ?? []
  if (flags.includes(flag)) return stop
  return { ...stop, readFlags: [...flags, flag] }
}

function locationForStop(stop: Stop): GeoPoint | undefined {
  if (stop.location) return stop.location
  if (STOP_COORDS[stop.name]) return STOP_COORDS[stop.name]
  const hit = Object.entries(STOP_COORDS).find(([name]) => namesMatch(stop.name, name))
  return hit?.[1]
}

export function hydrateStopLocations(trip: Trip): Trip {
  return {
    ...trip,
    days: trip.days.map((day) => ({
      ...day,
      stops: day.stops.map((stop) => {
        const location = locationForStop(stop)
        return location && !stop.location ? { ...stop, location } : stop
      }),
    })),
  }
}

function placeOwnsName(place: MappedPlace, name: string): boolean {
  if (matchesPlace(name, place)) return true
  if (place.mustBuy && namesMatch(name, place.mustBuy.name)) return true
  if (place.warning && namesMatch(name, place.warning.text)) return true
  return false
}

function stripPlaceFromStop(stop: Stop, place: MappedPlace, keep: boolean): Stop {
  if (keep) return stop
  return {
    ...stop,
    shops: stop.shops.filter((shop) => !placeOwnsName(place, shop.name)),
    mustBuys: stop.mustBuys.filter((item) => !placeOwnsName(place, item.name)),
    warnings: (stop.warnings ?? []).filter((item) => {
      if (!place.warning) return true
      return item.text !== place.warning.text && !namesMatch(item.text, place.warning.text)
    }),
  }
}

function applyPlaceToStop(stop: Stop, place: MappedPlace, pick: PlacePick): Stop {
  const evidence = evidenceFor(place, stop.id)
  let next = upsertWarning(stop, place)
  next = upsertShop(next, place, pick, evidence)
  next = upsertBuy(next, place, pick, evidence)
  next = pushFlag(next, "已按地图挂到已定路线，未改顺序")
  return { ...next, ocrLines: mergeOcr(next.ocrLines, place.ocrLines) }
}

function factCluster(name: string): string {
  const n = name.replace(/[（）()\s]/g, "")
  if (/鱼爱牛|松子酥|瓜子酥/.test(n)) return "yuainiu"
  if (/余美霞/.test(n)) return "yumeixia"
  if (/蒋家/.test(n) || (/肠旺面/.test(n) && !/余美霞/.test(n))) return "jiangjia"
  if (/巧八角/.test(n)) return "qiaobajiao"
  if (/玉珍/.test(n)) return "yuzhen"
  if (/毛阿姨/.test(n)) return "maayi"
  if (/毛辣果/.test(n)) return "malaiguo"
  if (/一杯黔茶/.test(n)) return "yiqiancha"
  if (/辣子鸡|黄杰/.test(n)) return "laziji"
  if (/好心情/.test(n)) return "haoxinqing"
  if (/滋滋铁板|滋铁板/.test(n)) return "zizi"
  if (/无骨鸡爪/.test(n)) return "zizi-claw"
  if (/板吉|大拇指牛肉|小七孔牛肉粉|小七孔东门牛肉/.test(n)) return "banji"
  if (/去茶山/.test(n)) return "quchashan"
  if (/高山3班|高山三班/.test(n)) return "gaoshan3"
  if (/原糯糯/.test(n)) return "yuannuonuo"
  if (/贵阳要吃要买/.test(n)) return "buy-list"
  if (/贵阳特色奶茶/.test(n)) return "tea-list"
  if (/廖胖子/.test(n)) return "liaopangzi"
  if (/佳杰蜡染/.test(n)) return "jiajie"
  return `n:${n}`
}

function mergeEvidence(a: Evidence[], b: Evidence[]): Evidence[] {
  let next = a
  for (const item of b) next = uniquePush(next, item)
  return next
}

function mergeShopGroup(items: Shop[]): Shop {
  return items.slice(1).reduce((acc, shop) => ({
    ...acc,
    note: acc.note.length >= shop.note.length ? acc.note : shop.note,
    hours: acc.hours || shop.hours,
    whatToLookFor: acc.whatToLookFor || shop.whatToLookFor,
    evidence: mergeEvidence(acc.evidence, shop.evidence),
    ocrLines: mergeOcr(acc.ocrLines, shop.ocrLines),
    uncertain: acc.uncertain || shop.uncertain,
    location: acc.location || shop.location,
    mapPick: acc.mapPick || shop.mapPick,
    images: acc.images?.length ? acc.images : shop.images,
  }), items[0])
}

function mergeBuyGroup(items: MustBuy[]): MustBuy {
  return items.slice(1).reduce((acc, item) => ({
    ...acc,
    name: /松子酥|鱼爱牛/.test(acc.name) || /松子酥|鱼爱牛/.test(item.name) ? "鱼爱牛松子酥" : acc.name,
    reason: acc.reason.length >= item.reason.length ? acc.reason : item.reason,
    budget: acc.budget || item.budget,
    tip: acc.tip.length >= item.tip.length ? acc.tip : item.tip,
    evidence: mergeEvidence(acc.evidence, item.evidence),
    ocrLines: mergeOcr(acc.ocrLines, item.ocrLines),
    uncertain: acc.uncertain || item.uncertain,
    mapPick: acc.mapPick || item.mapPick,
    images: acc.images?.length ? acc.images : item.images,
  }), items[0])
}

function dedupeList<T extends { name: string }>(items: T[], merge: (group: T[]) => T): T[] {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    const key = factCluster(item.name)
    const list = groups.get(key) || []
    list.push(item)
    groups.set(key, list)
  }
  return [...groups.values()].map(merge)
}

function dedupeStopCards(stop: Stop): Stop {
  const shops = dedupeList(stop.shops, mergeShopGroup).filter((shop) => shop.name)
  const mustBuys = dedupeList(stop.mustBuys, mergeBuyGroup)
  const warnings: Warning[] = []
  for (const warning of stop.warnings ?? []) {
    if (warnings.some((item) => item.text === warning.text || namesMatch(item.text, warning.text))) continue
    warnings.push(warning)
  }
  return { ...stop, shops, mustBuys, warnings }
}

function stripLeakedAcrossStops(trip: Trip, homes: Map<string, string>): Trip {
  const homeOf = (name: string): string | undefined => homes.get(factCluster(name))
  return {
    ...trip,
    days: trip.days.map((day) => ({
      ...day,
      stops: day.stops.map((stop) => {
        const shops = stop.shops.filter((shop) => {
          const home = homeOf(shop.name)
          return !home || home === stop.id
        })
        const mustBuys = stop.mustBuys.filter((item) => {
          const home = homeOf(item.name)
          return !home || home === stop.id
        })
        return dedupeStopCards({ ...stop, shops, mustBuys })
      }),
    })),
  }
}

export function applyMappedPlaces(trip: Trip, places: MappedPlace[] = catalog.places): Trip {
  let next = hydrateStopLocations(trip)
  const usable = places.filter((place) => Boolean(place.name))
  const homes = new Map<string, string>()

  for (const place of usable) {
    next = {
      ...next,
      days: next.days.map((day) => ({
        ...day,
        stops: day.stops.map((stop) => stripPlaceFromStop(stop, place, false)),
      })),
    }
  }

  for (const place of usable) {
    const branch = place.branches?.[0]
    const pick = pickStopForPlace(next, place, branch)
    if (!pick) continue
    homes.set(factCluster(place.name), pick.stopId)
    if (place.mustBuy) homes.set(factCluster(place.mustBuy.name), pick.stopId)
    next = {
      ...next,
      days: next.days.map((day) => ({
        ...day,
        stops: day.stops.map((stop) =>
          stop.id === pick.stopId ? applyPlaceToStop(stop, place, pick) : stop
        ),
      })),
    }
  }

  homes.set("yuainiu", homes.get("yuainiu") || "d4-gulou")
  homes.set("yiqiancha", homes.get("yiqiancha") || "d4-gulou")
  homes.set("jiangjia", homes.get("jiangjia") || "d2-jiangjia")
  homes.set("yumeixia", homes.get("yumeixia") || "d2-jiangjia")
  homes.set("qiaobajiao", homes.get("qiaobajiao") || "d2-qingyun")
  homes.set("yuzhen", homes.get("yuzhen") || "d1-yuzhen")
  homes.set("maayi", homes.get("maayi") || "d3-maayi")
  homes.set("buy-list", "d2-minsheng")
  homes.set("tea-list", homes.get("tea-list") || "d1-hunt")
  return stripLeakedAcrossStops(next, homes)
}

export function mappedSignature(trip: Trip): string {
  return trip.days
    .map((day) =>
      day.stops
        .map((stop) => {
          const shops = stop.shops.map((shop) => `${shop.name}:${shop.note}:${shop.mapPick?.why || ""}`).join(",")
          const buys = stop.mustBuys.map((item) => `${item.name}:${item.reason}:${item.tip}`).join(",")
          const loc = stop.location ? `${stop.location.lat}` : ""
          return `${stop.id}:${loc}:${shops}:${buys}`
        })
        .join("|")
    )
    .join("/")
}

export function hydrateMappedTrip(trip: Trip): Trip {
  const cleaned = cleanTripCopy(trip)
  if (!/贵州|贵阳|肇兴/.test(`${cleaned.destination} ${cleaned.title}`)) return cleaned
  return cleanTripCopy(applyMappedPlaces(hydrateStopLocations(cleaned)))
}

export function listedMappedPlaces(): MappedPlace[] {
  return catalog.places
}

export function findMappedPlace(query: string): MappedPlace | undefined {
  const blob = query.trim()
  return catalog.places.find((place) => matchesPlace(blob, place) || place.name.includes(blob))
}

export function dayMapStops(day: Day): { stop: Stop; shops: Shop[] }[] {
  return day.stops.map((stop) => ({
    stop,
    shops: stop.shops.filter((shop) => shop.location || shop.mapPick),
  }))
}

export function attachPlaceToTrip(
  trip: Trip,
  place: MappedPlace,
  forced?: { dayId: string; stopId: string }
): { trip: Trip; pick: PlacePick | null } {
  const hydrated = hydrateStopLocations(trip)
  const branch = place.branches?.[0]
  const auto = pickStopForPlace(hydrated, place, branch)
  const day = hydrated.days.find((item) => item.id === (forced?.dayId || auto?.dayId))
  const stop = day?.stops.find((item) => item.id === (forced?.stopId || auto?.stopId))
  if (!day || !stop) return { trip: hydrated, pick: auto }
  const pick: PlacePick = auto
    ? { ...auto, dayId: day.id, dayTitle: day.title, stopId: stop.id, stopName: stop.name }
    : {
        dayId: day.id,
        dayTitle: day.title,
        stopId: stop.id,
        stopName: stop.name,
        extraKm: 0,
        extraMin: 1,
        distanceKm: 0,
        branchName: branch?.name || place.name,
        address: branch?.address || "",
        location: branch
          ? { lat: branch.lat, lng: branch.lng, system: branch.system, address: branch.address }
          : stop.location,
        why: `按指定站点「${stop.name}」挂上，不改顺序。`,
      }
  const next: Trip = {
    ...hydrated,
    days: hydrated.days.map((entry) => ({
      ...entry,
      stops: entry.stops.map((item) =>
        item.id === stop.id ? applyPlaceToStop(item, place, pick) : stripPlaceFromStop(item, place, false)
      ),
    })),
  }
  return { trip: next, pick }
}

export type { PhotoSpot }
