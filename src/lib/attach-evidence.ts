import type { Evidence, Stop, Trip } from "@/data/types"
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

function withEvidence(stop: Stop, item: Evidence, slot: AttachTarget["slot"]): Stop {
  if (slot === "outfit") return stop
  if (slot === "shop" && stop.shops[0]) {
    const shops = stop.shops.map((shop, index) =>
      index === 0 ? { ...shop, evidence: uniquePush(shop.evidence, item) } : shop
    )
    return { ...stop, shops }
  }
  if (slot === "buy") {
    if (stop.mustBuys[0]) {
      const mustBuys = stop.mustBuys.map((buy, index) =>
        index === 0 ? { ...buy, evidence: uniquePush(buy.evidence, item) } : buy
      )
      return { ...stop, mustBuys }
    }
    return {
      ...stop,
      mustBuys: [
        {
          id: `${stop.id}-paste-buy`,
          name: item.caption.slice(0, 24) || "笔记里的必买",
          reason: item.quote,
          budget: "以现场为准",
          tip: "点开原帖看配图。",
          evidence: [item],
        },
      ],
    }
  }
  if (stop.photoSpots[0]) {
    const photoSpots = stop.photoSpots.map((spot, index) =>
      index === 0 ? { ...spot, evidence: uniquePush(spot.evidence, item) } : spot
    )
    return { ...stop, photoSpots }
  }
  if (stop.shops[0]) {
    const shops = stop.shops.map((shop, index) =>
      index === 0 ? { ...shop, evidence: uniquePush(shop.evidence, item) } : shop
    )
    return { ...stop, shops }
  }
  return stop
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
