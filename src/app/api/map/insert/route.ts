import { NextResponse } from "next/server"
import {
  attachPlaceToTrip,
  findMappedPlace,
  type MappedBranch,
  type MappedPlace,
} from "@/lib/map-insert"
import { geocodePublic } from "@/lib/geocode"
import { mutateSharedTrip, persistBackendLabel } from "@/lib/persist"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  let body: { query?: string; dayId?: string; stopId?: string } = {}
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: "请输入店名。" }, { status: 400 })
  }
  const query = (body.query || "").trim()
  if (query.length < 2) {
    return NextResponse.json({ error: "店名太短。" }, { status: 400 })
  }

  const curated = findMappedPlace(query)
  const live = curated?.branches?.length ? [] : await geocodePublic(query).catch(() => [])
  const branch: MappedBranch | undefined =
    curated?.branches?.[0] ||
    (live[0]
      ? {
          name: live[0].name || query,
          address: live[0].address || "",
          lat: live[0].location.lat,
          lng: live[0].location.lng,
          system: live[0].location.system,
        }
      : undefined)

  const place: MappedPlace = curated || {
    id: `live-${query}`,
    name: query,
    category: "吃喝",
    note: `沿路挂上：${query}。不改圆周旅迹顺序。`,
    whatToLookFor: query,
    mustBuy: {
      name: query,
      reason: `沿路检索后挂到已有站。`,
      budget: "以现场为准",
      tip: "没有插入新站点。",
    },
    prefer: [],
    uncertain: !curated && !branch,
    branches: branch ? [branch] : [],
  }

  let pick = null
  const trip = await mutateSharedTrip((current) => {
    const result = attachPlaceToTrip(
      current,
      place,
      body.dayId && body.stopId ? { dayId: body.dayId, stopId: body.stopId } : undefined
    )
    pick = result.pick
    return result.trip
  })

  if (!pick) {
    return NextResponse.json({ error: "当天路上对不上已有站，没有改行程。" }, { status: 422 })
  }

  return NextResponse.json({
    trip,
    backend: persistBackendLabel(),
    place: place.name,
    stopName: (pick as { stopName: string }).stopName,
    why: (pick as { why: string }).why,
    pick,
  })
}
