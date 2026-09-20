import type { Day, Stop } from "@/data/types"

const NAME_SLUGS: { test: RegExp; slug: string }[] = [
  { test: /谷莫尼/, slug: "gumon" },
  { test: /半山小筑|溪宿/, slug: "banshan" },
  { test: /堂安梯田/, slug: "tangan" },
  { test: /蒋家/, slug: "jiangjia" },
  { test: /青云市集/, slug: "qingyun" },
  { test: /亨特/, slug: "hunt" },
  { test: /广播电视/, slug: "tvtower" },
  { test: /鼓楼/, slug: "gulou" },
  { test: /堂安/, slug: "tangan" },
  { test: /猎人/, slug: "hunter" },
  { test: /民生/, slug: "minsheng" },
  { test: /小七孔/, slug: "xiaoqikong" },
  { test: /花椒/, slug: "huajiao" },
  { test: /侗家火锅/, slug: "dongjia" },
  { test: /牛棚/, slug: "niupeng" },
  { test: /毛阿姨/, slug: "maayi" },
  { test: /省府/, slug: "shengfu" },
  { test: /堰塘/, slug: "yantang" },
  { test: /电台街/, slug: "diantai" },
  { test: /圆通/, slug: "yuantong" },
  { test: /杨记/, slug: "yangji" },
  { test: /花屿|花果园/, slug: "huayu" },
  { test: /瑶家/, slug: "yaojia" },
  { test: /玉珍/, slug: "yuzhen" },
  { test: /翁布/, slug: "wengbu" },
  { test: /糯米/, slug: "nuomi" },
  { test: /机场|龙洞堡/, slug: "airport" },
]

function hashName(name: string): string {
  let hash = 2166136261
  for (const char of name) {
    hash ^= char.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

export function slugStopName(name: string): string {
  const hit = NAME_SLUGS.find((item) => item.test.test(name))
  if (hit) return hit.slug
  const ascii = name
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 16)
  return ascii || `stop-${hashName(name).slice(0, 6)}`
}

export function uniqueStopId(dayNumber: number, name: string, used: Set<string>): string {
  const base = `d${dayNumber}-${slugStopName(name)}`
  let id = base
  let n = 2
  while (used.has(id)) {
    id = `${base}-${n}`
    n += 1
  }
  used.add(id)
  return id
}

function decodeSegment(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function findStop(day: Day, stopId: string): Stop | undefined {
  const decoded = decodeSegment(stopId)
  const exact = day.stops.find(
    (stop) =>
      stop.id === decoded ||
      stop.id === stopId ||
      decodeSegment(stop.id) === decoded
  )
  if (exact) return exact

  const legacy = decoded.match(/^d(\d+)-s(\d+)$/i)
  if (legacy) {
    const order = Number(legacy[2])
    return day.stops.find((stop) => stop.order === order) || day.stops[order - 1]
  }

  const slugPart = decoded.replace(/^d\d+-/, "")
  if (!slugPart) return undefined
  return day.stops.find(
    (stop) =>
      slugStopName(stop.name) === slugPart ||
      stop.id === `d${day.dayNumber}-${slugPart}` ||
      stop.id.endsWith(`-${slugPart}`)
  )
}
