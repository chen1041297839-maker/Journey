import { NextResponse } from "next/server"
import { detectPlatform, extractPostUrls, fetchPublicPost } from "@/lib/social-posts"

export const runtime = "nodejs"

export async function POST(request: Request) {
  let body: { urls?: string; text?: string } = {}
  try {
    body = (await request.json()) as { urls?: string; text?: string }
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
    return NextResponse.json(
      { error: `暂不读取这种链接：${unsupported[0]}` },
      { status: 400 }
    )
  }

  const posts = []
  for (const url of urls) {
    posts.push(await fetchPublicPost(url))
  }

  return NextResponse.json({ posts })
}
