import type { Evidence, Stop, Trip, Warning } from "@/data/types"
import type { FetchedPost } from "@/lib/social-posts"
import { fetchedToEvidence, guessSlot, matchStopInTrip } from "@/lib/social-posts"

export type AttachTarget = {
  dayId?: string
  stopId?: string
  slot?: "photo" | "shop" | "buy" | "outfit"
}

export type AttachResult = {
  trip: Trip
  attached: { url: string; stopName: string; partialRead: boolean }[]
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

function withReadFlags(stop: Stop, item: Evidence): Stop {
  const flags = [...(stop.readFlags ?? [])]
  if (item.commentsGated && !flags.includes("评论网页读不到")) flags.push("评论网页读不到")
  if (item.imageListPartial && !flags.includes("配图清单网页读不全")) {
    flags.push("配图清单网页读不全")
  }
  const warnings = [...(stop.warnings ?? [])]
  for (const chunk of item.quote.split(/[。；\n]/)) {
    const line = chunk.trim()
    if (line.length < 4) continue
    if (!/踩雷|不推荐|别买|凉了就硬|不要打车|别穿高跟|别在民生路/.test(line)) continue
    if (warnings.some((entry) => entry.text.includes(line.slice(0, 10)))) continue
    const created: Warning = {
      id: `${stop.id}-paste-warn-${hashCode(line)}`,
      text: line,
      kind: /踩雷|不推荐/.test(line) ? "雷" : "注意",
    }
    warnings.push(created)
  }
  return {
    ...stop,
    warnings,
    readFlags: flags,
    commentsGated: stop.commentsGated || item.commentsGated,
    imageListPartial: stop.imageListPartial || item.imageListPartial,
  }
}

function ontoFirstPhoto(stop: Stop, item: Evidence): Stop {
  if (!stop.photoSpots[0]) return stop
  const photoSpots = stop.photoSpots.map((spot, index) =>
    index === 0 ? { ...spot, evidence: uniquePush(spot.evidence, item) } : spot
  )
  return { ...stop, photoSpots }
}

function withEvidence(stop: Stop, item: Evidence, slot: AttachTarget["slot"]): Stop {
  const flagged = withReadFlags(stop, item)
  if (slot === "outfit") return flagged
  if (slot === "shop" && flagged.shops[0]) {
    const shops = flagged.shops.map((shop, index) =>
      index === 0 ? { ...shop, evidence: uniquePush(shop.evidence, item) } : shop
    )
    return ontoFirstPhoto({ ...flagged, shops }, item)
  }
  if (slot === "buy") {
    if (flagged.mustBuys[0]) {
      const mustBuys = flagged.mustBuys.map((buy, index) =>
        index === 0 ? { ...buy, evidence: uniquePush(buy.evidence, item) } : buy
      )
      return ontoFirstPhoto({ ...flagged, mustBuys }, item)
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
            images: item.imageSrc && !item.imageSrc.endsWith(".svg")
              ? [{ src: item.imageSrc, alt: item.imageAlt || item.caption }]
              : [{ src: "", alt: "", missing: true, missingCount: 1 }],
          },
        ],
      },
      item
    )
  }
  if (flagged.photoSpots[0]) {
    return ontoFirstPhoto(flagged, item)
  }
  if (flagged.shops[0]) {
    const shops = flagged.shops.map((shop, index) =>
      index === 0 ? { ...shop, evidence: uniquePush(shop.evidence, item) } : shop
    )
    return { ...flagged, shops }
  }
  return flagged
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
            outfit: { ...entry.outfit, evidence: uniquePush(entry.outfit.evidence, evidence) },
          }
        }
        return {
          ...entry,
          stops: entry.stops.map((item) =>
            item.id === stop.id ? withEvidence(item, evidence, slot) : item
          ),
        }
      }),
    }
    attached.push({ url: post.url, stopName: stop.name, partialRead: post.partialRead })
  }

  return { trip: next, attached, unmatched }
}
