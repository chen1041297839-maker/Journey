import researched from "@/data/research/guizhou-posts.json"
import researchedSpots from "@/data/research/guizhou-spots.json"
import researchedFacts from "@/data/research/guizhou-facts.json"
import researchedImages from "@/data/research/guizhou-images.json"
import researchedOcr from "@/data/research/guizhou-ocr.json"
import type {
  Evidence,
  FactImage,
  MustBuy,
  OcrLine,
  Outfit,
  PhotoSpot,
  Platform,
  Shop,
  Stop,
  Warning,
} from "@/data/types"
import { uniqueByUrl } from "@/lib/evidence"
import { isStoredPhoto, noteKey } from "@/lib/note-key"

export { uniqueByUrl }

type Slot = "photo" | "shop" | "buy" | "outfit"
type ResearchRow = {
  aliases: string[]
  slot: Slot
  platform: Platform
  url: string
  caption: string
  quote: string
  imageSrc?: string
  partialRead?: boolean
  collectedBy?: "paste" | "search"
  commentsGated?: boolean
  imageListPartial?: boolean
  mustBuy?: {
    name: string
    reason: string
    budget: string
    tip: string
  }
}

type SpotPack = {
  aliases: string[]
  spots: {
    title: string
    standWhere: string
    angle: string
    shotLooksLike: string
    bestTime: string
    lens: string
    avoid: string
    palette: [string, string, string]
    evidenceNoteId: string
  }[]
}

type FactShop = {
  name: string
  category: string
  hours: string
  note: string
  whatToLookFor: string
  sourceNoteIds?: string[]
  ocrLines?: OcrLine[]
  uncertain?: boolean
}

type FactBuy = {
  name: string
  reason: string
  budget: string
  tip: string
  sourceNoteIds?: string[]
  ocrLines?: OcrLine[]
  uncertain?: boolean
}

type FactSpot = {
  title: string
  standWhere: string
  angle: string
  shotLooksLike: string
  bestTime: string
  lens: string
  avoid: string
  palette: [string, string, string]
  sourceNoteIds?: string[]
  ocrLines?: OcrLine[]
  uncertain?: boolean
}

type OcrPack = {
  noteId: string
  file: string
  aliases: string[]
  unreadableNote?: string | null
  lines?: OcrLine[]
  shops?: FactShop[]
  mustBuys?: FactBuy[]
  photoSpots?: FactSpot[]
  warnings?: { text: string; kind: "雷" | "注意"; ocrLines?: OcrLine[] }[]
}

type FactOutfit = {
  summary: string
  pieces: string[]
  why: string
  shoes: string
  bag: string
  colors: string[]
  avoid: string
}

type FactPack = {
  aliases: string[]
  summary?: string
  shops?: FactShop[]
  mustBuys?: FactBuy[]
  photoSpots?: FactSpot[]
  warnings?: { text: string; kind: "雷" | "注意" }[]
  outfit?: FactOutfit
  commentsGated?: boolean
  imageListPartial?: boolean
  imageListNote?: string
}

const rows = researched as ResearchRow[]
const packs = researchedSpots as SpotPack[]
const factPacks = researchedFacts as FactPack[]
const ocrPacks = researchedOcr as OcrPack[]
const imagePacks = researchedImages as Record<
  string,
  { files: string[]; alt?: string; expected?: number }
>

export function imagesFromEvidence(list: Evidence[]): FactImage[] {
  const images: FactImage[] = []
  const seen = new Set<string>()
  for (const item of uniqueByUrl(list)) {
    const key = noteKey(item.url)
    const pack = imagePacks[key]
    const files = pack?.files?.length
      ? pack.files
      : item.imageFiles?.length
        ? item.imageFiles.filter((src) => isStoredPhoto(src))
        : isStoredPhoto(item.imageSrc)
          ? [item.imageSrc]
          : []
    for (const src of files) {
      if (seen.has(src)) continue
      seen.add(src)
      images.push({ src, alt: pack?.alt || item.imageAlt || item.caption })
    }
  }
  return images
}

function attachFactImages(stop: Stop): Stop {
  let flags = [...(stop.readFlags ?? [])]
  const seenPacks = new Set<string>()
  for (const item of realEvidenceOnStop(stop)) {
    const key = noteKey(item.url)
    if (seenPacks.has(key)) continue
    seenPacks.add(key)
    const pack = imagePacks[key]
    if (!pack) {
      const hasPhoto = isStoredPhoto(item.imageSrc) || Boolean(item.imageFiles?.some((src) => isStoredPhoto(src)))
      if (!hasPhoto && !item.isSample) {
        flags = pushFlag(flags, "配图读不到")
      }
      continue
    }
    const missing = Math.max(0, (pack.expected ?? pack.files.length) - pack.files.length)
    if (missing > 0) {
      flags = pushFlag(
        flags,
        pack.files.length > 0
          ? `配图读不到：${pack.alt || "原帖"}还差 ${missing} 张`
          : "配图读不到"
      )
    }
  }
  const withImages = (evidence: Evidence[]): FactImage[] => {
    const photos = imagesFromEvidence(evidence)
    if (photos.length > 0) return photos
    const real = uniqueByUrl(evidence)
    if (real.length === 0) return []
    return [{ src: "", alt: "", missing: true, missingCount: 1 }]
  }
  const warningImages = withImages(realEvidenceOnStop(stop)).filter((item) => item.src).slice(0, 1)
  return {
    ...stop,
    readFlags: flags,
    shops: stop.shops.map((shop) => ({ ...shop, images: withImages(shop.evidence) })),
    mustBuys: stop.mustBuys.map((item) => ({ ...item, images: withImages(item.evidence) })),
    photoSpots: stop.photoSpots.map((spot) => ({ ...spot, images: withImages(spot.evidence) })),
    warnings: (stop.warnings ?? []).map((item) => ({
      ...item,
      images: warningImages,
    })),
  }
}

function matches(name: string, aliases: string[]): boolean {
  const isStay = /酒店|民宿|客栈|溪宿/.test(name)
  return aliases.some((alias) => {
    if (!name.includes(alias)) return false
    if (isStay && !/酒店|民宿|客栈|溪宿/.test(alias)) return false
    return true
  })
}

function hashCode(value: string): number {
  let hash = 0
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return Math.abs(hash)
}

function asEvidence(row: ResearchRow, seed: string): Evidence {
  const collectedBy = row.collectedBy || "search"
  const commentsGated = row.commentsGated !== false
  const imageListPartial = Boolean(row.imageListPartial)
  return {
    id: `${collectedBy}-${seed}-${hashCode(row.url)}`,
    platform: row.platform,
    url: row.url,
    caption: row.caption,
    quote: row.quote,
    imageSrc: row.imageSrc || `/samples/${row.platform}.svg`,
    imageAlt: row.partialRead || imageListPartial ? `${row.caption} · 网页读不全` : row.caption,
    isSample: false,
    partialRead: Boolean(row.partialRead),
    collectedBy,
    commentsGated,
    imageListPartial,
  }
}

function merge(list: Evidence[], extra: Evidence[]): Evidence[] {
  const next = uniqueByUrl([...extra, ...list])
  return next.length > 0 ? next : list.filter((item) => !item.isSample)
}

function stripSamples(list: Evidence[]): Evidence[] {
  const real = uniqueByUrl(list)
  return real.length > 0 ? real : []
}

function realEvidenceOnStop(stop: Stop): Evidence[] {
  return uniqueByUrl([
    ...stop.shops.flatMap((shop) => shop.evidence),
    ...stop.mustBuys.flatMap((item) => item.evidence),
    ...stop.photoSpots.flatMap((spot) => spot.evidence),
    ...(stop.warnings ? [] : []),
  ])
}

function isGenericShop(shop: Shop): boolean {
  return /沿街小店|附近摊位|游客中心/.test(shop.name)
}

function isGenericPhoto(spot: PhotoSpot): boolean {
  return /入口|巷口$|上桌第一口|院子或大堂|主景机位/.test(spot.title) &&
    spot.evidence.every((item) => item.isSample)
}

function evidenceForIds(ids: string[] | undefined, seed: string): Evidence[] {
  if (!ids?.length) return []
  const found: Evidence[] = []
  for (const id of ids) {
    const row = rows.find((item) => item.url.includes(id))
    if (row) found.push(asEvidence(row, `${seed}-${id}`))
  }
  return uniqueByUrl(found)
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

function upsertShop(stop: Stop, spec: FactShop, seed: string): Stop {
  const evidence = evidenceForIds(spec.sourceNoteIds, `${seed}-shop`)
  const created: Shop = {
    id: `${stop.id}-shop-${hashCode(spec.name)}`,
    name: spec.name,
    category: spec.category,
    hours: spec.hours,
    note: spec.note,
    whatToLookFor: spec.whatToLookFor,
    evidence,
    ocrLines: spec.ocrLines,
    uncertain: spec.uncertain,
  }
  const existing = stop.shops.find(
    (shop) => sameName(shop.name, spec.name) || sameName(shop.name, stop.name)
  )
  if (existing && (sameName(existing.name, spec.name) || stop.shops.length === 1)) {
    return {
      ...stop,
      shops: stop.shops.map((shop) =>
        shop.id === existing.id
          ? {
              ...shop,
              name: spec.name,
              category: spec.category || shop.category,
              hours: spec.hours || shop.hours,
              note: spec.note,
              whatToLookFor: spec.whatToLookFor || shop.whatToLookFor,
              evidence: merge(shop.evidence, evidence),
              ocrLines: mergeOcrLines(shop.ocrLines, spec.ocrLines),
              uncertain: shop.uncertain || spec.uncertain,
            }
          : shop
      ),
    }
  }
  const kept = stop.shops.filter((shop) => !isGenericShop(shop) && !shop.evidence.every((item) => item.isSample))
  return { ...stop, shops: [...kept, created] }
}

function upsertMustBuy(stop: Stop, spec: FactBuy, seed: string): Stop {
  const evidence = evidenceForIds(spec.sourceNoteIds, `${seed}-buy`)
  const existing = stop.mustBuys.find((item) => sameName(item.name, spec.name))
  if (existing) {
    return {
      ...stop,
      mustBuys: stop.mustBuys.map((item) =>
        item.id === existing.id
          ? {
              ...item,
              reason: spec.reason,
              budget: spec.budget || item.budget,
              tip: spec.tip,
              evidence: merge(item.evidence, evidence),
              ocrLines: mergeOcrLines(item.ocrLines, spec.ocrLines),
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
    evidence,
    ocrLines: spec.ocrLines,
    uncertain: spec.uncertain,
  }
  const kept = stop.mustBuys.filter((item) => !item.evidence.every((card) => card.isSample))
  return { ...stop, mustBuys: [...kept, created] }
}

function mergePhotoSpot(stop: Stop, spec: FactSpot, seed: string): Stop {
  const evidence = evidenceForIds(spec.sourceNoteIds, `${seed}-spot`)
  const created: PhotoSpot = {
    id: `${stop.id}-fs-${hashCode(spec.title)}`,
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
    evidence,
    ocrLines: spec.ocrLines,
    uncertain: spec.uncertain,
  }
  const existing = stop.photoSpots.find((spot) => sameName(spot.title, spec.title))
  if (existing) {
    return {
      ...stop,
      photoSpots: stop.photoSpots.map((spot) =>
        spot.id === existing.id
          ? {
              ...spot,
              standWhere: spec.standWhere,
              angle: spec.angle,
              shotLooksLike: spec.shotLooksLike,
              bestTime: spec.bestTime,
              lens: spec.lens,
              avoid: spec.avoid,
              evidence: merge(spot.evidence, evidence),
              ocrLines: mergeOcrLines(spot.ocrLines, spec.ocrLines),
              uncertain: spot.uncertain || spec.uncertain,
            }
          : spot
      ),
    }
  }
  const kept = stop.photoSpots.filter((spot) => !isGenericPhoto(spot))
  return { ...stop, photoSpots: [...kept, created] }
}

function mergeWarning(stop: Stop, spec: { text: string; kind: "雷" | "注意" }): Stop {
  const warnings = stop.warnings ?? []
  if (warnings.some((item) => item.text === spec.text)) return stop
  const created: Warning = {
    id: `${stop.id}-warn-${hashCode(spec.text)}`,
    text: spec.text,
    kind: spec.kind,
  }
  return { ...stop, warnings: [...warnings, created] }
}

function pushFlag(flags: string[], value: string): string[] {
  if (flags.includes(value)) return flags
  return [...flags, value]
}

function applyFactPacks(stop: Stop): Stop {
  const hits = factPacks.filter((pack) => matches(stop.name, pack.aliases))
  let next: Stop = { ...stop, warnings: stop.warnings ?? [] }
  let flags = [...(stop.readFlags ?? [])]
  for (const pack of hits) {
    if (pack.summary) next = { ...next, note: pack.summary }
    if (pack.commentsGated !== false) {
      next = { ...next, commentsGated: true }
      flags = pushFlag(flags, "评论网页读不到")
    }
    if (pack.imageListPartial) {
      next = { ...next, imageListPartial: true }
      flags = pushFlag(flags, pack.imageListNote || "配图清单网页读不全")
    }
    for (const shop of pack.shops ?? []) next = upsertShop(next, shop, stop.id)
    for (const buy of pack.mustBuys ?? []) next = upsertMustBuy(next, buy, stop.id)
    for (const spot of pack.photoSpots ?? []) next = mergePhotoSpot(next, spot, stop.id)
    for (const warning of pack.warnings ?? []) next = mergeWarning(next, warning)
  }
  if (hits.length > 0) {
    next = {
      ...next,
      shops: next.shops.filter((shop) => !isGenericShop(shop)),
      mustBuys: next.mustBuys.filter(
        (item) => !/招牌一份 \+ 一份素的|水 \+ 一件轻的手作|笔记里的必买/.test(item.name)
      ),
    }
  }
  return { ...next, readFlags: flags }
}

function applyOcrPacks(stop: Stop): Stop {
  const hits = ocrPacks.filter((pack) => matches(stop.name, pack.aliases))
  if (hits.length === 0) return stop
  let next: Stop = { ...stop, ocrLines: [...(stop.ocrLines ?? [])] }
  let flags = [...(stop.readFlags ?? [])]
  for (const pack of hits) {
    next = { ...next, ocrLines: mergeOcrLines(next.ocrLines, pack.lines) }
    if (pack.unreadableNote) flags = pushFlag(flags, pack.unreadableNote)
    if ((pack.lines ?? []).some((line) => line.uncertain) || pack.shops?.some((shop) => shop.uncertain)) {
      flags = pushFlag(flags, "部分 OCR 识别不确定")
    }
    for (const shop of pack.shops ?? []) next = upsertShop(next, shop, `${stop.id}-ocr`)
    for (const buy of pack.mustBuys ?? []) next = upsertMustBuy(next, buy, `${stop.id}-ocr`)
    for (const spot of pack.photoSpots ?? []) next = mergePhotoSpot(next, spot, `${stop.id}-ocr`)
    for (const warning of pack.warnings ?? []) next = mergeWarning(next, warning)
  }
  return { ...next, readFlags: flags }
}

function evidenceByNoteId(noteId: string): Evidence | undefined {
  const row = rows.find((item) => item.url.includes(noteId))
  return row ? asEvidence(row, noteId) : undefined
}

function applyPhotoPacks(stop: Stop): Stop {
  const pack = packs.find((item) => matches(stop.name, item.aliases))
  if (!pack) return stop
  const photoSpots: PhotoSpot[] = pack.spots.map((spot, index) => {
    const evidence = evidenceByNoteId(spot.evidenceNoteId)
    return {
      id: `${stop.id}-rs${index + 1}`,
      title: spot.title,
      standWhere: spot.standWhere,
      angle: spot.angle,
      shotLooksLike: spot.shotLooksLike,
      bestTime: spot.bestTime,
      lens: spot.lens,
      avoid: spot.avoid,
      composition: {
        sky: "上 20%",
        subject: "主体居中偏上",
        foreground: "地面、桥面或田埂",
        palette: spot.palette as [string, string, string],
      },
      evidence: evidence ? [evidence] : [],
    }
  })
  const extras = (stop.photoSpots ?? []).filter(
    (spot) => !photoSpots.some((item) => sameName(item.title, spot.title)) && !isGenericPhoto(spot)
  )
  return { ...stop, photoSpots: [...photoSpots, ...extras] }
}

function attachRowSources(stop: Stop): Stop {
  const hits = rows.filter((row) => matches(stop.name, row.aliases))
  let next = { ...stop }
  for (const [index, row] of hits.entries()) {
    const evidence = asEvidence(row, `${stop.id}-${index}`)
    if (row.commentsGated !== false) {
      next = {
        ...next,
        commentsGated: true,
        readFlags: pushFlag(next.readFlags ?? [], "评论网页读不到"),
      }
    }
    if (row.imageListPartial) {
      next = {
        ...next,
        imageListPartial: true,
        readFlags: pushFlag(next.readFlags ?? [], "配图清单网页读不全"),
      }
    }
    if (row.mustBuy) {
      next = upsertMustBuy(next, row.mustBuy, `${stop.id}-row`)
      const target = next.mustBuys.find((item) => item.name === row.mustBuy?.name)
      if (target) {
        next = {
          ...next,
          mustBuys: next.mustBuys.map((item) =>
            item.id === target.id ? { ...item, evidence: merge(item.evidence, [evidence]) } : item
          ),
        }
      }
      continue
    }
    if (row.slot === "shop" && next.shops[0]) {
      next = {
        ...next,
        shops: next.shops.map((shop, shopIndex) =>
          shopIndex === 0 ? { ...shop, evidence: merge(shop.evidence, [evidence]) } : shop
        ),
      }
      continue
    }
    if (row.slot === "outfit") continue
    if (next.photoSpots[0]) {
      next = {
        ...next,
        photoSpots: next.photoSpots.map((spot, spotIndex) =>
          spotIndex === 0 ? { ...spot, evidence: merge(spot.evidence, [evidence]) } : spot
        ),
      }
    } else if (next.shops[0]) {
      next = {
        ...next,
        shops: next.shops.map((shop, shopIndex) =>
          shopIndex === 0 ? { ...shop, evidence: merge(shop.evidence, [evidence]) } : shop
        ),
      }
    }
  }
  return next
}

function preferRealEvidence(stop: Stop): Stop {
  const real = realEvidenceOnStop(stop)
  const fill = (list: Evidence[]): Evidence[] => {
    const stripped = stripSamples(list)
    if (stripped.length > 0) return stripped
    return real.slice(0, 1)
  }
  return {
    ...stop,
    shops: stop.shops.map((shop) => ({ ...shop, evidence: fill(shop.evidence) })),
    mustBuys: stop.mustBuys.map((item) => ({ ...item, evidence: fill(item.evidence) })),
    photoSpots: stop.photoSpots.map((spot) => ({ ...spot, evidence: fill(spot.evidence) })),
  }
}

export function applyResearchedEvidence(stop: Stop): Stop {
  const withFacts = applyFactPacks({ ...stop, warnings: stop.warnings ?? [] })
  const withOcr = applyOcrPacks(applyPhotoPacks(withFacts))
  return attachFactImages(preferRealEvidence(attachRowSources(withOcr)))
}

export function researchedOutfitEvidence(label: string, seed: string): Evidence[] {
  return rows
    .filter((row) => row.slot === "outfit" && row.aliases.some((alias) => label.includes(alias)))
    .map((row, index) => asEvidence(row, `${seed}-outfit-${index}`))
}

export function applyResearchedOutfit(outfit: Outfit, label: string, seed: string): Outfit {
  const matched = factPacks.filter(
    (item) => item.outfit && item.aliases.some((alias) => label.includes(alias))
  )
  const evidence = uniqueByUrl([
    ...researchedOutfitEvidence(label, seed),
    ...outfit.evidence,
  ])
  if (matched.length === 0) return { ...outfit, evidence, images: imagesFromEvidence(evidence) }
  const pieces = Array.from(
    new Set(matched.flatMap((item) => item.outfit?.pieces ?? []))
  ).slice(0, 6)
  const colors = Array.from(
    new Set(matched.flatMap((item) => item.outfit?.colors ?? []))
  ).slice(0, 4)
  const avoids = matched.map((item) => item.outfit?.avoid).filter(Boolean) as string[]
  const first = matched[0].outfit!
  return {
    summary: first.summary,
    pieces: pieces.length > 0 ? pieces : outfit.pieces,
    why: first.why,
    shoes: first.shoes,
    bag: first.bag,
    colors: colors.length > 0 ? colors : outfit.colors,
    avoid: avoids.join("；") || outfit.avoid,
    evidence,
    images: imagesFromEvidence(evidence),
  }
}
