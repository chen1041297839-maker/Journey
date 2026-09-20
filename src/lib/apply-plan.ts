import type { Day, PlanMode, Stop, Trip } from "@/data/types"

function mergePool(trip: Trip): Stop[] {
  const byKey = new Map<string, Stop>()
  const add = (stops: Stop[], prefer: boolean) => {
    for (const stop of stops) {
      const key = `${stop.name}::${stop.id}`
      const existing = byKey.get(key)
      if (!existing || prefer) byKey.set(key, stop)
    }
  }
  add(trip.proposal?.importedDays.flatMap((day) => day.stops) ?? [], false)
  add(trip.proposal?.suggestedDays.flatMap((day) => day.stops) ?? [], false)
  add(trip.days.flatMap((day) => day.stops), true)
  return [...byKey.values()]
}

function takeStop(pool: Stop[], taken: Set<string>, name: string, dayId: string): Stop | undefined {
  const sameDay = pool.find(
    (stop) => stop.name === name && !taken.has(stop.id) && stop.id.startsWith(`${dayId}-`)
  )
  const any = pool.find((stop) => stop.name === name && !taken.has(stop.id))
  const hit = sameDay || any
  if (hit) taken.add(hit.id)
  return hit
}

export function adoptStopOrder(trip: Trip, templateDays: Day[], planMode: PlanMode): Trip {
  const pool = mergePool(trip)
  const taken = new Set<string>()
  const days = templateDays.map((day) => ({
    ...day,
    outfit: trip.days.find((item) => item.dayNumber === day.dayNumber)?.outfit ?? day.outfit,
    stops: day.stops.map((template, index) => {
      const live = takeStop(pool, taken, template.name, day.id)
      if (!live) return { ...template, order: index + 1 }
      return {
        ...live,
        id: template.id,
        order: index + 1,
        arrive: template.arrive,
        timeBlock: template.timeBlock,
        optional: template.optional,
      }
    }),
  }))
  return { ...trip, days, planMode }
}

export function applySuggestedPlan(trip: Trip): Trip {
  if (!trip.proposal?.suggestedDays.length) return trip
  return adoptStopOrder(trip, trip.proposal.suggestedDays, "suggested")
}

export function revertImportedPlan(trip: Trip): Trip {
  if (!trip.proposal?.importedDays.length) return trip
  return adoptStopOrder(trip, trip.proposal.importedDays, "imported")
}
