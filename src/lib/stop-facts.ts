import type { Stop } from "@/data/types"

function hasReal(list: { evidence: { isSample: boolean }[] }[]): boolean {
  return list.some((item) => item.evidence.some((card) => !card.isSample))
}

export function stopFactLine(stop: Stop): string {
  const lei = (stop.warnings ?? []).find((item) => item.kind === "雷")
  const notice = (stop.warnings ?? []).find((item) => item.kind === "注意")
  const buy = stop.mustBuys.find((item) => item.evidence.some((card) => !card.isSample)) || stop.mustBuys[0]
  const shop = stop.shops.find((item) => !/沿街小店|附近摊位|游客中心/.test(item.name))
  const parts: string[] = []
  if (lei) parts.push(`雷 ${lei.text}`)
  else if (notice) parts.push(notice.text)
  if (buy) parts.push(buy.name)
  else if (shop) parts.push(shop.name)
  if (parts.length > 0) return parts.slice(0, 2).join(" · ")
  return stop.note
}

export function stopFactChips(stop: Stop): string[] {
  const chips: string[] = []
  const leiCount = (stop.warnings ?? []).filter((item) => item.kind === "雷").length
  if (leiCount > 0) chips.push(`${leiCount} 条雷`)
  if (hasReal(stop.shops) || stop.shops.some((shop) => !/沿街小店|附近摊位/.test(shop.name))) {
    chips.push(`${stop.shops.length} 店`)
  }
  if (stop.mustBuys.length > 0) chips.push(`${stop.mustBuys.length} 必买`)
  if (stop.photoSpots.length > 0) chips.push(`${stop.photoSpots.length} 机位`)
  return chips
}
