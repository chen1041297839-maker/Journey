import { NextResponse } from "next/server"
import { loadSharedTrip, persistBackendLabel, saveSharedTrip } from "@/lib/persist"
import type { Trip } from "@/data/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const trip = await loadSharedTrip()
  return NextResponse.json({ trip, backend: persistBackendLabel() })
}

export async function PUT(request: Request) {
  let body: { trip?: Trip } = {}
  try {
    body = (await request.json()) as { trip?: Trip }
  } catch {
    return NextResponse.json({ error: "行程格式不对。" }, { status: 400 })
  }
  if (!body.trip?.days?.length) {
    return NextResponse.json({ error: "没有可保存的行程。" }, { status: 400 })
  }
  const trip = await saveSharedTrip(body.trip)
  return NextResponse.json({ trip, backend: persistBackendLabel() })
}
