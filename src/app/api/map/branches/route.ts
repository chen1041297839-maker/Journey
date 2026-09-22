import { NextResponse } from "next/server"
import {
  findMappedPlace,
  hydrateStopLocations,
  pickStopForPlace,
  type MappedBranch,
  type MappedPlace,
} from "@/lib/map-insert"
import { geocodePublic } from "@/lib/geocode"
import { loadSharedTrip } from "@/lib/persist"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  let body: { query?: string; dayId?: string } = {}
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: "请输入店名。" }, { status: 400 })
  }
  const query = (body.query || "").trim()
  if (query.length < 2) {
    return NextResponse.json({ error: "店名太短。" }, { status: 400 })
  }

  const trip = hydrateStopLocations(await loadSharedTrip())
  const curated = findMappedPlace(query)
  const live = await geocodePublic(query).catch(() => [])
  const branches: MappedBranch[] =
    curated?.branches?.length
      ? curated.branches
      : live.slice(0, 5).map((item) => ({
          name: item.name,
          address: item.address,
          lat: item.location.lat,
          lng: item.location.lng,
          system: item.location.system,
        }))

  const place: MappedPlace = curated || {
    id: `live-${query}`,
    name: query,
    category: "吃喝",
    note: `沿路检索：${query}`,
    prefer: [],
    branches,
  }

  const picks = (branches.length > 0 ? branches : [undefined]).map((branch) =>
    pickStopForPlace(trip, { ...place, branches: branch ? [branch] : [] }, branch)
  )
  const best = picks.filter(Boolean).sort((a, b) => (a?.extraKm ?? 99) - (b?.extraKm ?? 99))[0]
  return NextResponse.json({
    query,
    dayId: body.dayId || best?.dayId,
    curated: Boolean(curated),
    pick: best,
    branches,
  })
}
