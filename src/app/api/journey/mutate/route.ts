import { NextResponse } from "next/server"
import type { Evidence } from "@/data/types"
import { defaultSampleTrip, planFromText } from "@/lib/plan-itinerary"
import { isPitravelInput } from "@/lib/pitravel"
import { mutateSharedTrip, persistBackendLabel } from "@/lib/persist"
import { countStops, parseRouteText } from "@/lib/parse-routes"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function applyEvidencePatch(trip: ReturnType<typeof defaultSampleTrip>, evidenceId: string, patch: Partial<Evidence>) {
  const mapList = (list: Evidence[]) =>
    list.map((item) => (item.id === evidenceId ? { ...item, ...patch } : item))
  return {
    ...trip,
    days: trip.days.map((day) => ({
      ...day,
      outfit: { ...day.outfit, evidence: mapList(day.outfit.evidence) },
      stops: day.stops.map((stop) => ({
        ...stop,
        shops: stop.shops.map((shop) => ({ ...shop, evidence: mapList(shop.evidence) })),
        mustBuys: stop.mustBuys.map((item) => ({ ...item, evidence: mapList(item.evidence) })),
        photoSpots: stop.photoSpots.map((spot) => ({ ...spot, evidence: mapList(spot.evidence) })),
      })),
    })),
    proposal: trip.proposal
      ? {
          ...trip.proposal,
          importedDays: trip.proposal.importedDays.map((day) => ({
            ...day,
            outfit: { ...day.outfit, evidence: mapList(day.outfit.evidence) },
            stops: day.stops.map((stop) => ({
              ...stop,
              shops: stop.shops.map((shop) => ({ ...shop, evidence: mapList(shop.evidence) })),
              mustBuys: stop.mustBuys.map((item) => ({ ...item, evidence: mapList(item.evidence) })),
              photoSpots: stop.photoSpots.map((spot) => ({ ...spot, evidence: mapList(spot.evidence) })),
            })),
          })),
          suggestedDays: trip.proposal.suggestedDays.map((day) => ({
            ...day,
            outfit: { ...day.outfit, evidence: mapList(day.outfit.evidence) },
            stops: day.stops.map((stop) => ({
              ...stop,
              shops: stop.shops.map((shop) => ({ ...shop, evidence: mapList(shop.evidence) })),
              mustBuys: stop.mustBuys.map((item) => ({ ...item, evidence: mapList(item.evidence) })),
              photoSpots: stop.photoSpots.map((spot) => ({ ...spot, evidence: mapList(spot.evidence) })),
            })),
          })),
        }
      : trip.proposal,
  }
}

export async function POST(request: Request) {
  let body: {
    action?: string
    text?: string
    isSample?: boolean
    evidenceId?: string
    patch?: Partial<Evidence>
  } = {}
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: "请求格式不对。" }, { status: 400 })
  }

  if (body.action === "reset") {
    const trip = await mutateSharedTrip(() => defaultSampleTrip())
    return NextResponse.json({ trip, backend: persistBackendLabel() })
  }

  if (body.action === "patch-evidence") {
    if (!body.evidenceId) {
      return NextResponse.json({ error: "缺少来源 id。" }, { status: 400 })
    }
    const trip = await mutateSharedTrip((current) =>
      applyEvidencePatch(current, body.evidenceId as string, body.patch || {})
    )
    return NextResponse.json({ trip, backend: persistBackendLabel() })
  }

  const text = (body.text || "").trim()
  if (!text) {
    return NextResponse.json({ error: "请先贴入地点或示例行程。" }, { status: 400 })
  }
  if (!body.isSample && isPitravelInput(text)) {
    return NextResponse.json(
      { error: "圆周旅迹链接请走导入接口。" },
      { status: 400 }
    )
  }
  if (countStops(parseRouteText(text)) === 0) {
    return NextResponse.json(
      { error: "请先贴入至少一处地点，或按天把站点加到右侧列表。" },
      { status: 400 }
    )
  }
  try {
    const trip = await mutateSharedTrip(() => planFromText(text, Boolean(body.isSample)))
    return NextResponse.json({ trip, backend: persistBackendLabel() })
  } catch {
    return NextResponse.json({ error: "排期失败，请检查粘贴格式后再试。" }, { status: 400 })
  }
}
