import { NextResponse } from "next/server"
import importedJourney from "@/data/imported/pitravel-7662387918598377796.json"
import { planFromPitravel } from "@/lib/plan-itinerary"
import {
  extractJourneyId,
  officialDetailUrl,
  officialShareUrl,
  parsePitravelPayload,
  pitravelErrorMessage,
  XENIA_JOURNEY_ID,
} from "@/lib/pitravel"

export const runtime = "nodejs"

async function fetchOfficial(journeyId: string): Promise<unknown> {
  const response = await fetch(officialDetailUrl(journeyId), {
    headers: {
      Accept: "application/json, text/plain, */*",
      "User-Agent":
        "Mozilla/5.0 (compatible; XeniaItinerary/1.0; +https://www.pitravel.cn/)",
      Referer: officialShareUrl(journeyId),
    },
    cache: "no-store",
  })
  if (!response.ok) {
    throw new Error(`圆周旅迹返回 ${response.status}`)
  }
  return response.json()
}

export async function POST(request: Request) {
  let body: { url?: string } = {}
  try {
    body = (await request.json()) as { url?: string }
  } catch {
    return NextResponse.json({ error: "请贴入圆周旅迹分享链接。" }, { status: 400 })
  }

  const input = (body.url || "").trim()
  const journeyId = extractJourneyId(input)
  if (!journeyId) {
    return NextResponse.json(
      { error: "这不像圆周旅迹分享链接。请粘贴 pitravel.cn 的行程详情页，或只填数字 ID。" },
      { status: 400 }
    )
  }

  const shareUrl = input.startsWith("http") ? input : officialShareUrl(journeyId)

  try {
    const payload = await fetchOfficial(journeyId)
    const record = payload as { code?: number; msg?: string }
    if (typeof record.code === "number" && record.code !== 0) {
      if (journeyId === XENIA_JOURNEY_ID) {
        const fallback = parsePitravelPayload(importedJourney, shareUrl)
        return NextResponse.json({
          trip: planFromPitravel(fallback),
          meta: fallback.meta,
          sourceText: fallback.sourceText,
          usedSnapshot: true,
        })
      }
      return NextResponse.json(
        { error: pitravelErrorMessage(record.code, record.msg) },
        { status: 422 }
      )
    }
    const imported = parsePitravelPayload(payload, shareUrl)
    return NextResponse.json({
      trip: planFromPitravel(imported),
      meta: imported.meta,
      sourceText: imported.sourceText,
      usedSnapshot: false,
    })
  } catch (error) {
    if (journeyId === XENIA_JOURNEY_ID) {
      const fallback = parsePitravelPayload(importedJourney, shareUrl)
      return NextResponse.json({
        trip: planFromPitravel(fallback),
        meta: fallback.meta,
        sourceText: fallback.sourceText,
        usedSnapshot: true,
      })
    }
    const message = error instanceof Error ? error.message : "导入失败"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
