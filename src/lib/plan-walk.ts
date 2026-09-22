import type { DraftDay, DraftStop, PlanChange, TimeBlock } from "@/data/types"

const BLOCK_CLOCK: Record<TimeBlock, number> = {
  morning: 8 * 60 + 30,
  noon: 12 * 60,
  afternoon: 14 * 60,
  evening: 17 * 60 + 30,
  night: 19 * 60,
  optional: 15 * 60,
}

function isStay(stop: DraftStop): boolean {
  return /酒店|民宿|客栈|溪宿/.test(`${stop.category || ""}${stop.name}`)
}

function clusterOf(stop: DraftStop): { key: string; rank: number } {
  const blob = `${stop.name} ${stop.area || ""} ${stop.category || ""}`
  if (/机场|龙洞堡/.test(blob)) return { key: "龙洞堡", rank: 90 }
  if (/小七孔|瑶家|荔波|黔南/.test(blob)) return { key: "荔波·小七孔", rank: 40 }
  if (/堂安梯田|牛棚咖啡/.test(blob)) return { key: "堂安", rank: 55 }
  if (/肇兴|鼓楼|花椒|猎人|侗家火锅|半山小筑|蜡染/.test(blob) || /黔东南|黎平/.test(blob)) {
    return { key: "肇兴", rank: 50 }
  }
  if (/翁布|安顺/.test(blob)) return { key: "安顺", rank: 70 }
  if (/织金|毕节/.test(blob)) return { key: "毕节", rank: 80 }
  if (/花屿|花果园/.test(blob)) return { key: "花果园", rank: 25 }
  if (/民生|堰塘|省府|电台街|圆通|杨记烤肉|玉珍|喷水池|毛阿姨|沙河|传书巷/.test(blob)) {
    return { key: "云岩·老城", rank: 20 }
  }
  if (/青云|蒋家|亨特|谷莫尼|广播电视|甲秀|开心果/.test(blob)) {
    return { key: "南明·青云", rank: 10 }
  }
  if (/贵阳/.test(blob)) return { key: "贵阳", rank: 30 }
  return { key: stop.area || "其他", rank: 60 }
}

const NAME_ORDER: { test: RegExp; order: number }[] = [
  { test: /谷莫尼|半山小筑|溪宿/, order: 1 },
  { test: /毛阿姨/, order: 2 },
  { test: /蒋家肠旺/, order: 3 },
  { test: /青云市集/, order: 4 },
  { test: /广播电视/, order: 5 },
  { test: /亨特/, order: 6 },
  { test: /玉珍/, order: 7 },
  { test: /猎人/, order: 8 },
  { test: /省府北街/, order: 10 },
  { test: /堰塘街/, order: 11 },
  { test: /电台街/, order: 12 },
  { test: /圆通街/, order: 13 },
  { test: /民生路/, order: 14 },
  { test: /花屿/, order: 20 },
  { test: /小七孔/, order: 30 },
  { test: /瑶家/, order: 31 },
  { test: /鼓楼/, order: 40 },
  { test: /花椒树下/, order: 41 },
  { test: /堂安/, order: 50 },
  { test: /牛棚/, order: 51 },
  { test: /侗家火锅/, order: 52 },
  { test: /杨记烤肉/, order: 60 },
  { test: /机场/, order: 90 },
]

function nameOrder(name: string): number {
  const hit = NAME_ORDER.find((item) => item.test.test(name))
  return hit ? hit.order : 35
}

function assignBlock(stop: DraftStop, dayLabel: string): TimeBlock {
  const n = stop.name
  if (isStay(stop)) return "afternoon"
  if (/花屿|花果园/.test(n)) return "optional"
  if (/毛阿姨|蒋家肠旺|机场/.test(n)) return "morning"
  if (/青云市集|广播电视|亨特/.test(n) && !/到达/.test(dayLabel)) return "morning"
  if (/玉珍|杨记烤肉|花椒树下|侗家火锅/.test(n)) return "night"
  if (/堂安梯田|牛棚咖啡/.test(n)) return "evening"
  if (/猎人/.test(n)) return "morning"
  if (/鼓楼|小七孔/.test(n)) return "afternoon"
  if (/省府|堰塘|电台|圆通|民生/.test(n)) return "afternoon"
  return "afternoon"
}

function formatArrive(totalMinutes: number): string {
  const clamped = Math.max(7 * 60, Math.min(21 * 60, totalMinutes))
  const h = Math.floor(clamped / 60)
  const m = clamped % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

function stampTimes(stops: DraftStop[]): DraftStop[] {
  const used: Record<string, number> = {}
  return stops.map((stop) => {
    const block = stop.timeBlock || "afternoon"
    const base = BLOCK_CLOCK[block]
    const offset = used[block] || 0
    used[block] = offset + 50
    return { ...stop, time: formatArrive(base + offset) }
  })
}

function dedupeKeepOrder(stops: DraftStop[]): DraftStop[] {
  const seen = new Set<string>()
  const next: DraftStop[] = []
  for (const stop of stops) {
    if (seen.has(stop.name)) continue
    seen.add(stop.name)
    next.push(stop)
  }
  return next
}

function dropRedundantStays(days: DraftDay[]): DraftDay[] {
  let currentStay = ""
  return days.map((day, index) => {
    const wishlist = /待计划|备选/.test(day.label)
    const stays = day.stops.filter(isStay)
    const others = day.stops.filter((stop) => !isStay(stop))
    const stay = stays[0]
    const isNew = Boolean(stay && stay.name !== currentStay)
    if (stay) currentStay = stay.name
    if (wishlist) {
      return { ...day, stops: dedupeKeepOrder([...others, ...stays.slice(0, 1)]) }
    }
    if (!stay || !isNew) {
      return { ...day, stops: dedupeKeepOrder(others) }
    }
    const arrival = index === 0 || /到达|抵达/.test(day.label)
    const placed = arrival || others.length === 0 ? [stay, ...others] : [stay, ...others]
    return { ...day, stops: dedupeKeepOrder(placed) }
  })
}

const BLOCK_RANK: Record<TimeBlock, number> = {
  morning: 1,
  noon: 2,
  optional: 3,
  afternoon: 4,
  evening: 5,
  night: 6,
}

function sortWalkable(stops: DraftStop[]): DraftStop[] {
  return [...stops].sort((a, b) => {
    const ba = BLOCK_RANK[a.timeBlock || "afternoon"]
    const bb = BLOCK_RANK[b.timeBlock || "afternoon"]
    if (ba !== bb) return ba - bb
    const ca = clusterOf(a)
    const cb = clusterOf(b)
    if (ca.rank !== cb.rank) return ca.rank - cb.rank
    return nameOrder(a.name) - nameOrder(b.name)
  })
}

function planNoteFor(day: DraftDay, rawNames: string[], droppedHotels: boolean): string {
  if (/待计划|备选/.test(day.label)) {
    return "备选没有排进正日子。按城市拆开，并去掉已经出现在正日子里的重复点。"
  }
  if (/到达/.test(day.label)) {
    return "圆周旅迹是酒店→喷水池火锅→亨特→再回酒店。推荐：先在南明入住并逛亨特，晚上再去喷水池吃玉珍；重复的回酒店已去掉。"
  }
  if (/拍照逛吃/.test(day.label)) {
    return "原导入把南明、花果园、云岩老城串成一条直线。推荐：上午青云片区（肠旺面→市集→电视台地下），下午按省府北街→堰塘街→电台街→圆通街→民生路走；花屿在花果园，要打车，标成可选；晚上杨记烤肉。当天回酒店不占一站。"
  }
  if (/小七孔/.test(day.label)) {
    return "东进东出写在小七孔站要点里，不改导入站序：早饭糯米饭 → 小七孔景区 → 瑶家土菜馆。园内 P2–P14 不当新地图点。大七孔游船和回贵阳烙锅只当晚备注。晚上回贵阳酒店不占一站。"
  }
  if (/黔东南|抵达/.test(day.label)) {
    return "入住半山小筑只写一次。下午走鼓楼群，晚上花椒树下。去掉重复回民宿。"
  }
  if (/梯田|民俗/.test(day.label)) {
    return "原顺序先堂安再回寨买蜡染。推荐：上午猎人部落，下午堂安梯田+牛棚咖啡赶日落，晚上回寨吃侗家火锅。"
  }
  if (/机场/.test(day.label) || day.stops.some((stop) => /机场/.test(stop.name))) {
    return "返程只留机场。行李在正日子里已经住过的酒店处理，不再插回酒店点。"
  }
  return droppedHotels
    ? "已按片区重排，并合并了重复的回酒店。"
    : "已按片区、可步行顺序重排，并加上时间块。"
}

function wishlistBuckets(days: DraftDay[], scheduledNames: Set<string>): DraftDay[] {
  const wish = days.filter((day) => /待计划|备选/.test(day.label))
  const extras: DraftDay[] = []
  for (const day of wish) {
    const buckets = new Map<string, DraftStop[]>()
    for (const stop of day.stops) {
      if (scheduledNames.has(stop.name)) continue
      const key = clusterOf(stop).key
      const label =
        key === "安顺" || /安顺/.test(key)
          ? "安顺备选"
          : key === "肇兴" || key === "堂安" || /黔东南/.test(key)
            ? "黔东南备选"
            : key === "毕节" || /织金/.test(key)
              ? "毕节备选"
              : /贵阳|南明|云岩|花果园/.test(key)
                ? "贵阳备选"
                : `${key}备选`
      const list = buckets.get(label) || []
      list.push(stop)
      buckets.set(label, list)
    }
    let number = days.filter((item) => !/待计划|备选/.test(item.label)).length
    for (const [label, stops] of buckets) {
      number += 1
      extras.push({
        dayNumber: number,
        label: `待计划 · ${label}`,
        stops: sortWalkable(dedupeKeepOrder(stops)),
        planNote: "备选没有排进正日子。按城市拆开，并去掉已经出现在正日子里的重复点。",
        rawStopNames: stops.map((stop) => stop.name),
      })
    }
  }
  return extras
}

function blockFromMinutes(total: number): TimeBlock {
  if (total < 11 * 60) return "morning"
  if (total < 13 * 60 + 30) return "noon"
  if (total < 17 * 60) return "afternoon"
  if (total < 19 * 60) return "evening"
  return "night"
}

function parseArrive(time?: string): number | null {
  if (!time) return null
  const parts = time.split(":").map(Number)
  if (!Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) return null
  return parts[0] * 60 + parts[1]
}

/** Keep 圆周旅迹 order. Only stamp clock so the timeline can group; never sort or drop. */
export function preserveImportedDays(days: DraftDay[]): DraftDay[] {
  return days.map((day) => {
    let clock = 8 * 60 + 30
    const stops = day.stops.map((stop) => {
      const minutes = parseArrive(stop.time) ?? clock
      const time = stop.time || formatArrive(minutes)
      clock = minutes + 50
      return {
        ...stop,
        time,
        timeBlock: stop.timeBlock || blockFromMinutes(minutes),
        optional: Boolean(stop.optional),
      }
    })
    return {
      ...day,
      stops,
      rawStopNames: day.stops.map((stop) => stop.name),
      planNote: "按圆周旅迹导入顺序。规划建议不会自动改这一天。",
    }
  })
}

function namesOf(day: DraftDay): string[] {
  return day.stops.map((stop) => stop.name)
}

function sameSequence(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((name, index) => name === b[index])
}

export function describePlanChanges(imported: DraftDay[], suggested: DraftDay[]): PlanChange[] {
  const changes: PlanChange[] = []
  const suggestedByNumber = new Map(suggested.map((day) => [day.dayNumber, day]))
  const used = new Set<number>()

  for (const day of imported) {
    const keep = namesOf(day)
    const match = suggestedByNumber.get(day.dayNumber)
    if (!match) {
      changes.push({
        dayTitle: day.label,
        why: "建议里不再单独保留这一天。",
        keep,
        apply: [],
      })
      continue
    }
    used.add(match.dayNumber)
    const apply = namesOf(match)
    if (sameSequence(keep, apply)) continue
    const droppedHotels = keep.filter((name) => /酒店|民宿|客栈|溪宿/.test(name) && !apply.includes(name))
    changes.push({
      dayTitle: day.label,
      why: match.planNote || (droppedHotels.length > 0
        ? `建议去掉重复回酒店：${droppedHotels.join("、")}。`
        : "建议按片区重排，减少折返。"),
      keep,
      apply,
    })
  }

  for (const day of suggested) {
    if (used.has(day.dayNumber)) continue
    changes.push({
      dayTitle: day.label,
      why: day.planNote || "建议把这一天从导入里拆出来。",
      keep: [],
      apply: namesOf(day),
    })
  }

  return changes
}

export function planWalkableDays(days: DraftDay[]): DraftDay[] {
  const scheduled = days.filter((day) => !/待计划|备选/.test(day.label))
  const stripped = dropRedundantStays(scheduled)
  const planned = stripped.map((day, index) => {
    const rawStopNames = scheduled[index]?.stops.map((stop) => stop.name) || day.stops.map((stop) => stop.name)
    const droppedHotels = rawStopNames.length !== day.stops.length
    const stamped = day.stops.map((stop) => ({
      ...stop,
      timeBlock: assignBlock(stop, day.label),
      optional: /花屿|花果园/.test(stop.name),
    }))
    const ordered = stampTimes(sortWalkable(stamped))
    return {
      ...day,
      stops: ordered,
      rawStopNames,
      planNote: planNoteFor(day, rawStopNames, droppedHotels),
    }
  })
  const scheduledNames = new Set(planned.flatMap((day) => day.stops.map((stop) => stop.name)))
  const extras = wishlistBuckets(days, scheduledNames).map((day) => ({
    ...day,
    stops: stampTimes(
      day.stops.map((stop) => ({
        ...stop,
        timeBlock: assignBlock(stop, day.label),
        optional: true,
      }))
    ),
  }))
  return [...planned, ...extras]
}

export function timeBlockStart(block: TimeBlock): string {
  return formatArrive(BLOCK_CLOCK[block])
}
