import { NextResponse } from "next/server"
import { applySuggestedPlan, revertImportedPlan } from "@/lib/apply-plan"
import { mutateSharedTrip, persistBackendLabel } from "@/lib/persist"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  let body: { action?: string } = {}
  try {
    body = (await request.json()) as { action?: string }
  } catch {
    return NextResponse.json({ error: "请选择保持原顺序或采用建议。" }, { status: 400 })
  }
  const action = body.action
  if (action !== "apply" && action !== "revert" && action !== "keep") {
    return NextResponse.json({ error: "未知的规划操作。" }, { status: 400 })
  }
  const trip = await mutateSharedTrip((current) => {
    if (action === "apply") return applySuggestedPlan(current)
    if (action === "revert") return revertImportedPlan(current)
    return { ...current, planMode: current.planMode || "imported" }
  })
  return NextResponse.json({ trip, backend: persistBackendLabel() })
}
