import type { XhsRef } from "@/data/types"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function XhsRefCard({ item }: { item: XhsRef }) {
  return (
    <Card size="sm" className="h-full bg-card">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary">精选笔记</Badge>
          <span className="text-[11px] text-muted-foreground">{item.vibe}</span>
        </div>
        <CardTitle className="font-heading text-base leading-snug">
          {item.caption}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm leading-relaxed">
        <p>
          <span className="text-muted-foreground">怎么站 · </span>
          {item.poseTips}
        </p>
        <p>
          <span className="text-muted-foreground">怎么穿 · </span>
          {item.outfitNotes}
        </p>
        {item.url ? (
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline-offset-4 hover:underline"
          >
            打开笔记链接
          </a>
        ) : (
          <p className="text-xs text-muted-foreground">
            还没有粘贴链接。以后把小红书笔记 URL 填进数据里的 `url` 字段即可。
          </p>
        )}
      </CardContent>
    </Card>
  )
}
