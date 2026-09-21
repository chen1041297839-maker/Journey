import type {
  Evidence,
  FactImage,
  MustBuy,
  OcrLine,
  PhotoSpot,
  Shop,
  Stop,
  Trip,
  Warning,
} from "@/data/types"
import type { ExtractedFacts } from "@/lib/extract-facts"
import { isStoredPhoto } from "@/lib/note-key"
import type { FetchedPost } from "@/lib/social-posts"
import { fetchedToEvidence, guessSlot, matchStopInTrip } from "@/lib/social-posts"

export type AttachTarget = {
  dayId?: string
  stopId?: string
  slot?: "photo" | "shop" | "buy" | "outfit"
}

export type AttachResult = {
  trip: Trip
  attached: {
    url: string
    stopName: string
    partialRead: boolean
    ocrCount: number
    imageCount: number
  }[]
  unmatched: FetchedPost[]
}

function uniquePush(list: Evidence[], item: Evidence): Evidence[] {
  if (list.some((entry) => entry.url === item.url)) return list
  return [item, ...list.filter((entry) => !entry.isSample)]
}

function hashCode(value: string): number {
  let hash = 0
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return Math.abs(hash)
}

function sameName(a: string, b: string): boolean {
  return a === b || a.includes(b) || b.includes(a)
}

function mergeOcrLines(current?: OcrLine[], extra?: OcrLine[]): OcrLine[] | undefined {
  if (!extra?.length) return current
  const next = [...(current ?? [])]
  for (const line of extra) {
    if (next.some((item) => item.text === line.text)) continue
    next.push(line)
  }
  return next
}

function photosFromEvidence(item: Evidence): FactImage[] {
  const files =
    item.imageFiles?.length
      ? item.imageFiles
      : isStoredPhoto(item.imageSrc)
        ? [item.imageSrc]
        : []
  return files.map((src) => ({ src, alt: item.imageAlt || item.caption }))
}

function mergePhotos(current?: FactImage[], extra?: FactImage[]): FactImage[] | undefined {
  if (!extra?.length) return current
  const next = [...(current ?? [])]
  for (const image of extra) {
    if (!image.src || next.some((item) => item.src === image.src)) continue
    next.push(image)
  }
  return next.length > 0 ? next : current
}

function pushFlag(flags: string[], value: string): string[] {
  if (flags.includes(value)) return flags
  return [...flags, value]
}

function withReadFlags(stop: Stop, item: Evidence, post: FetchedPost): Stop {
  let flags = [...(stop.readFlags ?? [])]
  if (item.commentsGated) flags = pushFlag(flags, "评论网页读不到")
  if (item.imageListPartial) flags = pushFlag(flags, "配图清单网页读不全")
  const stored = post.storedImages?.length || 0
  const expected = post.expectedImageCount || 0
  if (stored === 0 && !isStoredPhoto(item.imageSrc)) {
    flags = pushFlag(flags, "配图读不到")
  } else if (expected > stored) {
    flags = pushFlag(flags, `配图读不到：还差 ${expected - stored} 张`)
  }
  if ((post.ocrLines || []).some((line) => line.uncertain)) {
    flags = pushFlag(flags, "部分 OCR 识别不确定")
  }
  const warnings = [...(stop.warnings ?? [])]
  for (const chunk of item.quote.split(/[。；\n]/)) {
    const line = chunk.trim()
    if (line.length < 4) continue
    if (!/踩雷|不推荐|别买|凉了就硬|不要打车|别穿高跟|别在民生路/.test(line)) continue
    if (warnings.some((entry) => entry.text.includes(line.slice(0, 10)))) continue
    warnings.push({
      id: `${stop.id}-paste-warn-${hashCode(line)}`,
      text: line,
      kind: /踩雷|不推荐/.test(line) ? "雷" : "注意",
    })
  }
  return {
    ...stop,
    warnings,
    readFlags: flags,
    commentsGated: stop.commentsGated || item.commentsGated,
    imageListPartial: stop.imageListPartial || item.imageListPartial,
    ocrLines: mergeOcrLines(stop.ocrLines, post.ocrLines),
  }
}

function ontoFirstPhoto(stop: Stop, item: Evidence, images: FactImage[]): Stop {
  if (!stop.photoSpots[0]) return stop
  const photoSpots = stop.photoSpots.map((spot, index) =>
    index === 0
      ? {
          ...spot,
          evidence: uniquePush(spot.evidence, item),
          images: mergePhotos(spot.images, images),
        }
      : spot
  )
  return { ...stop, photoSpots }
}

function upsertShop(stop: Stop, spec: ExtractedFacts["shops"][0], evidence: Evidence, images: FactImage[]): Stop {
  const created: Shop = {
    id: `${stop.id}-shop-${hashCode(spec.name)}`,
    name: spec.name,
    category: spec.category,
    hours: spec.hours,
    note: spec.note,
    whatToLookFor: spec.whatToLookFor,
    evidence: [evidence],
    images,
    uncertain: spec.uncertain,
  }
  const existing = stop.shops.find((shop) => sameName(shop.name, spec.name))
  if (existing) {
    return {
      ...stop,
      shops: stop.shops.map((shop) =>
        shop.id === existing.id
          ? {
              ...shop,
              note: spec.note || shop.note,
              hours: spec.hours || shop.hours,
              evidence: uniquePush(shop.evidence, evidence),
              images: mergePhotos(shop.images, images),
              uncertain: shop.uncertain || spec.uncertain,
            }
          : shop
      ),
    }
  }
  const kept = stop.shops.filter((shop) => !/沿街小店|附近摊位|游客中心/.test(shop.name))
  return { ...stop, shops: [...kept, created] }
}

function upsertBuy(stop: Stop, spec: ExtractedFacts["mustBuys"][0], evidence: Evidence, images: FactImage[]): Stop {
  const existing = stop.mustBuys.find((item) => sameName(item.name, spec.name))
  if (existing) {
    return {
      ...stop,
      mustBuys: stop.mustBuys.map((item) =>
        item.id === existing.id
          ? {
              ...item,
              reason: spec.reason || item.reason,
              budget: spec.budget || item.budget,
              evidence: uniquePush(item.evidence, evidence),
              images: mergePhotos(item.images, images),
              uncertain: item.uncertain || spec.uncertain,
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
    images,
    uncertain: spec.uncertain,
  }
  return { ...stop, mustBuys: [...stop.mustBuys.filter((item) => !item.evidence.every((card) => card.isSample)), created] }
}

function upsertSpot(stop: Stop, spec: ExtractedFacts["photoSpots"][0], evidence: Evidence, images: FactImage[]): Stop {
  const existing = stop.photoSpots.find((spot) => sameName(spot.title, spec.title))
  if (existing) {
    return {
      ...stop,
      photoSpots: stop.photoSpots.map((spot) =>
        spot.id === existing.id
          ? {
              ...spot,
              standWhere: spec.standWhere || spot.standWhere,
              evidence: uniquePush(spot.evidence, evidence),
              images: mergePhotos(spot.images, images),
              uncertain: spot.uncertain || spec.uncertain,
            }
          : spot
      ),
    }
  }
  const created: PhotoSpot = {
    id: `${stop.id}-ps-${hashCode(spec.title)}`,
    title: spec.title,
    standWhere: spec.standWhere,
    angle: spec.angle,
    shotLooksLike: spec.shotLooksLike,
    bestTime: spec.bestTime,
    lens: spec.lens,
    avoid: spec.avoid,
    composition: {
      sky: "上 20%",
      subject: "主体居中偏上",
      foreground: "地面、桥面或田埂",
      palette: spec.palette,
    },
    evidence: [evidence],
    images,
    uncertain: spec.uncertain,
  }
  return { ...stop, photoSpots: [...stop.photoSpots, created] }
}

function applyFacts(stop: Stop, post: FetchedPost, evidence: Evidence): Stop {
  const images = photosFromEvidence(evidence)
  let next = stop
  const facts = post.facts
  if (!facts) return next
  for (const shop of facts.shops) next = upsertShop(next, shop, evidence, images)
  for (const buy of facts.mustBuys) next = upsertBuy(next, buy, evidence, images)
  for (const spot of facts.photoSpots) next = upsertSpot(next, spot, evidence, images)
  for (const warning of facts.warnings) {
    if ((next.warnings ?? []).some((item) => item.text === warning.text)) continue
    const created: Warning = {
      id: `${next.id}-warn-${hashCode(warning.text)}`,
      text: warning.text,
      kind: warning.kind,
      images,
    }
    next = { ...next, warnings: [...(next.warnings ?? []), created] }
  }
  return next
}

function withEvidence(stop: Stop, item: Evidence, slot: AttachTarget["slot"], post: FetchedPost): Stop {
  const images = photosFromEvidence(item)
  const flagged = applyFacts(withReadFlags(stop, item, post), post, item)
  if (slot === "outfit") return flagged
  if (factsFilled(post)) return ontoFirstPhoto(flagged, item, images)
  if (slot === "shop" && flagged.shops[0]) {
    const shops = flagged.shops.map((shop, index) =>
      index === 0
        ? {
            ...shop,
            evidence: uniquePush(shop.evidence, item),
            images: mergePhotos(shop.images, images),
          }
        : shop
    )
    return ontoFirstPhoto({ ...flagged, shops }, item, images)
  }
  if (slot === "buy") {
    if (flagged.mustBuys[0]) {
      const mustBuys = flagged.mustBuys.map((buy, index) =>
        index === 0
          ? {
              ...buy,
              evidence: uniquePush(buy.evidence, item),
              images: mergePhotos(buy.images, images),
            }
          : buy
      )
      return ontoFirstPhoto({ ...flagged, mustBuys }, item, images)
    }
    return ontoFirstPhoto(
      {
        ...flagged,
        mustBuys: [
          {
            id: `${flagged.id}-paste-buy`,
            name: item.caption.slice(0, 24) || "笔记里的必买",
            reason: item.quote,
            budget: "以现场为准",
            tip: item.commentsGated ? "评论网页读不到，先按正文。" : "以正文抽出的店名为准。",
            evidence: [item],
            images: images.length > 0 ? images : [{ src: "", alt: "", missing: true, missingCount: 1 }],
          },
        ],
      },
      item,
      images
    )
  }
  if (flagged.photoSpots[0]) return ontoFirstPhoto(flagged, item, images)
  if (flagged.shops[0]) {
    const shops = flagged.shops.map((shop, index) =>
      index === 0
        ? {
            ...shop,
            evidence: uniquePush(shop.evidence, item),
            images: mergePhotos(shop.images, images),
          }
        : shop
    )
    return { ...flagged, shops }
  }
  return flagged
}

function factsFilled(post: FetchedPost): boolean {
  const facts = post.facts
  if (!facts) return false
  return facts.shops.length + facts.mustBuys.length + facts.photoSpots.length > 0
}

export function attachOcrPayloadToTrip(
  trip: Trip,
  target: { dayId: string; stopId: string },
  payload: {
    images: FactImage[]
    ocrLines: OcrLine[]
    facts: ExtractedFacts
  }
): { trip: Trip; stopName: string; ocrCount: number; imageCount: number } | null {
  const day = trip.days.find((item) => item.id === target.dayId)
  const stop = day?.stops.find((item) => item.id === target.stopId)
  if (!day || !stop) return null

  const hash = hashCode(payload.images.map((item) => item.src).join("|") || String(Date.now()))
  const evidence: Evidence = {
    id: `upload-${stop.id}-${hash}`,
    platform: "xiaohongshu",
    url: `xenia://upload/${stop.id}/${hash}`,
    caption: "上传的清单截图",
    quote: payload.ocrLines.map((line) => line.text).join("；").slice(0, 420) || "从上传截图 OCR。",
    imageSrc: payload.images[0]?.src || "",
    imageAlt: "上传的清单截图",
    isSample: false,
    collectedBy: "upload",
    imageFiles: payload.images.map((item) => item.src).filter(Boolean),
  }
  const post: FetchedPost = {
    url: evidence.url,
    canonicalUrl: evidence.url,
    platform: "xiaohongshu",
    caption: evidence.caption,
    quote: evidence.quote,
    imageSrc: evidence.imageSrc,
    imageAlt: evidence.imageAlt,
    partialRead: false,
    commentsGated: false,
    imageListPartial: false,
    storedImages: evidence.imageFiles,
    ocrLines: payload.ocrLines,
    facts: payload.facts,
    expectedImageCount: payload.images.length,
  }

  let nextStop = withReadFlags(stop, evidence, post)
  nextStop = applyFacts(nextStop, post, evidence)
  nextStop = attachImagesToPartialLists(nextStop, evidence, payload.images, payload.ocrLines)
  nextStop = {
    ...nextStop,
    readFlags: pushFlag(
      nextStop.readFlags ?? [],
      payload.ocrLines.length > 0
        ? "清单已从上传截图 OCR"
        : "截图已上传，但没读到可用文字"
    ),
  }

  const nextTrip: Trip = {
    ...trip,
    days: trip.days.map((entry) =>
      entry.id !== day.id
        ? entry
        : {
            ...entry,
            stops: entry.stops.map((item) => (item.id === stop.id ? nextStop : item)),
          }
    ),
  }
  return {
    trip: nextTrip,
    stopName: stop.name,
    ocrCount: payload.ocrLines.length,
    imageCount: payload.images.length,
  }
}

function attachImagesToPartialLists(
  stop: Stop,
  evidence: Evidence,
  images: FactImage[],
  ocrLines: OcrLine[]
): Stop {
  if (images.length === 0 && ocrLines.length === 0) return stop
  const patch = <T extends { evidence: Evidence[]; images?: FactImage[]; ocrLines?: OcrLine[] }>(
    item: T
  ): T => {
    if (!item.evidence.some((card) => card.imageListPartial)) return item
    return {
      ...item,
      evidence: uniquePush(item.evidence, evidence),
      images: mergePhotos(item.images, images),
      ocrLines: mergeOcrLines(item.ocrLines, ocrLines),
    }
  }
  return {
    ...stop,
    shops: stop.shops.map(patch),
    mustBuys: stop.mustBuys.map(patch),
    photoSpots: stop.photoSpots.map(patch),
  }
}

export function attachPostsToTrip(
  trip: Trip,
  posts: FetchedPost[],
  target: AttachTarget = {},
  hintText = ""
): AttachResult {
  let next = trip
  const attached: AttachResult["attached"] = []
  const unmatched: FetchedPost[] = []

  for (const [index, post] of posts.entries()) {
    const blob = `${hintText} ${post.caption} ${post.quote} ${post.url}`
    const matched =
      target.stopId && target.dayId
        ? { dayId: target.dayId, stopId: target.stopId, name: "", score: 99 }
        : matchStopInTrip(next, blob)
    const day =
      next.days.find((item) => item.id === (target.dayId || matched?.dayId)) ||
      next.days.find((item) => item.stops.some((entry) => entry.id === target.stopId))
    const stop = day?.stops.find((item) => item.id === (target.stopId || matched?.stopId))
    if (!day || !stop) {
      unmatched.push(post)
      continue
    }
    const evidence = fetchedToEvidence(post, `${stop.id}-${index}`)
    const slot = target.slot || guessSlot(blob)
    next = {
      ...next,
      days: next.days.map((entry) => {
        if (entry.id !== day.id) return entry
        if (slot === "outfit") {
          return {
            ...entry,
            outfit: {
              ...entry.outfit,
              evidence: uniquePush(entry.outfit.evidence, evidence),
              images: mergePhotos(entry.outfit.images, photosFromEvidence(evidence)),
            },
          }
        }
        return {
          ...entry,
          stops: entry.stops.map((item) =>
            item.id === stop.id ? withEvidence(item, evidence, slot, post) : item
          ),
        }
      }),
    }
    attached.push({
      url: post.url,
      stopName: stop.name,
      partialRead: post.partialRead,
      ocrCount: post.ocrLines?.length || 0,
      imageCount: post.storedImages?.length || 0,
    })
  }

  return { trip: next, attached, unmatched }
}
