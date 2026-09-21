import { NextResponse } from "next/server"
import { attachPostsToTrip } from "@/lib/attach-evidence"
import { enrichFetchedPost } from "@/lib/enrich-post"
import { mutateSharedTrip } from "@/lib/persist"
import { detectPlatform, extractPostUrls, fetchPublicPost, type FetchedPost } from "@/lib/social-posts"

export const runtime = "nodejs"
export const maxDuration = 60
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  let body: { urls?: string; text?: string; dayId?: string; stopId?: string } = {}
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: "请贴入笔记链接。" }, { status: 400 })
  }

  const urls = extractPostUrls(`${body.text || ""}\n${body.urls || ""}`)
  if (urls.length === 0) {
    return NextResponse.json(
      { error: "没有识别到小红书 / 抖音 / Instagram 链接。一行一个即可。" },
      { status: 400 }
    )
  }
  if (urls.length > 12) {
    return NextResponse.json({ error: "一次最多读取 12 条链接。" }, { status: 400 })
  }

  const unsupported = urls.filter((url) => !detectPlatform(url))
  if (unsupported.length > 0) {
    return NextResponse.json({ error: `暂不读取这种链接：${unsupported[0]}` }, { status: 400 })
  }

  const posts: FetchedPost[] = []
  for (const url of urls) {
    const fetched = await fetchPublicPost(url)
    posts.push(await enrichFetchedPost(fetched))
  }

  let attached: ReturnType<typeof attachPostsToTrip>["attached"] = []
  let unmatched: ReturnType<typeof attachPostsToTrip>["unmatched"] = []
  const trip = await mutateSharedTrip((current) => {
    const result = attachPostsToTrip(current, posts, {
      dayId: body.dayId,
      stopId: body.stopId,
    }, `${body.text || ""}\n${body.urls || ""}`)
    attached = result.attached
    unmatched = result.unmatched
    return result.trip
  })

  return NextResponse.json({ trip, posts, attached, unmatched })
}
