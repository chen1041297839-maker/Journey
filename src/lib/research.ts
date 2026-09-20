import researched from "@/data/research/guizhou-posts.json"
import researchedSpots from "@/data/research/guizhou-spots.json"
import type { Evidence, MustBuy, PhotoSpot, Platform, Stop } from "@/data/types"

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

const rows = researched as ResearchRow[]
const packs = researchedSpots as SpotPack[]

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
  return {
    id: `${collectedBy}-${seed}-${hashCode(row.url)}`,
    platform: row.platform,
    url: row.url,
    caption: row.caption,
    quote: row.quote,
    imageSrc: row.imageSrc || `/samples/${row.platform}.svg`,
    imageAlt: row.partialRead ? `${row.caption} · 网页读不全` : row.caption,
    isSample: false,
    partialRead: Boolean(row.partialRead),
    collectedBy,
  }
}

function merge(list: Evidence[], extra: Evidence[]): Evidence[] {
  const next = [...extra]
  for (const item of list) {
    if (item.isSample) continue
    if (next.some((entry) => entry.url === item.url)) continue
    next.push(item)
  }
  return next.length > 0 ? next : list
}

function evidenceByNoteId(noteId: string): Evidence | undefined {
  const row = rows.find((item) => item.url.includes(noteId))
  return row ? asEvidence(row, noteId) : undefined
}

function applyPhotoPacks(stop: Stop): Stop {
  const pack = packs.find((item) => matches(stop.name, item.aliases))
  if (!pack) return stop
  const carried = stop.photoSpots.flatMap((spot) => spot.evidence).filter((item) => !item.isSample)
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
  if (carried.length > 0 && photoSpots[0]) {
    photoSpots[0] = { ...photoSpots[0], evidence: merge(photoSpots[0].evidence, carried) }
  }
  return { ...stop, photoSpots }
}

function upsertMustBuy(stop: Stop, row: ResearchRow, evidence: Evidence): Stop {
  const spec = row.mustBuy
  if (!spec) {
    if (stop.mustBuys[0]) {
      return {
        ...stop,
        mustBuys: stop.mustBuys.map((item, index) =>
          index === 0 ? { ...item, evidence: merge(item.evidence, [evidence]) } : item
        ),
      }
    }
    const created: MustBuy = {
      id: `${stop.id}-buy-${hashCode(row.url)}`,
      name: row.caption.slice(0, 24) || "笔记里的必买",
      reason: row.quote,
      budget: "以现场为准",
      tip: "点开原帖看配图清单。",
      evidence: [evidence],
    }
    return { ...stop, mustBuys: [created] }
  }
  const existing = stop.mustBuys.find((item) => item.name === spec.name)
  if (existing) {
    return {
      ...stop,
      mustBuys: stop.mustBuys.map((item) =>
        item.name === spec.name ? { ...item, evidence: merge(item.evidence, [evidence]) } : item
      ),
    }
  }
  const created: MustBuy = {
    id: `${stop.id}-buy-${hashCode(row.url)}`,
    name: spec.name,
    reason: spec.reason,
    budget: spec.budget,
    tip: spec.tip,
    evidence: [evidence],
  }
  return { ...stop, mustBuys: [created, ...stop.mustBuys.filter((item) => !item.evidence.every((card) => card.isSample))] }
}

export function applyResearchedEvidence(stop: Stop): Stop {
  const hits = rows.filter((row) => matches(stop.name, row.aliases))
  let next = { ...stop }
  for (const [index, row] of hits.entries()) {
    const evidence = asEvidence(row, `${stop.id}-${index}`)
    if (row.mustBuy || row.slot === "buy") {
      next = upsertMustBuy(next, row, evidence)
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
    }
  }
  return applyPhotoPacks(next)
}

export function researchedOutfitEvidence(label: string, seed: string): Evidence[] {
  return rows
    .filter((row) => row.slot === "outfit" && row.aliases.some((alias) => label.includes(alias)))
    .map((row, index) => asEvidence(row, `${seed}-outfit-${index}`))
}
