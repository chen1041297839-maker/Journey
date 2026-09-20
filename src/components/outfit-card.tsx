"use client"

import type { Outfit } from "@/data/types"
import { SourceLinks } from "@/components/source-links"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function OutfitCard({
  outfit,
  compact = false,
}: {
  outfit: Outfit
  compact?: boolean
}) {
  if (compact) {
    return (
      <div className="rounded-xl border border-border bg-card px-4 py-3 ring-1 ring-foreground/5">
        <p className="text-[11px] tracking-[0.16em] text-primary">当日穿搭</p>
        <p className="mt-1 font-heading text-sm leading-snug">{outfit.summary}</p>
        <p className="mt-2 text-xs text-muted-foreground">鞋 · {outfit.shoes}</p>
      </div>
    )
  }

  return (
    <Card className="bg-card">
      <CardHeader className="border-b">
        <p className="text-[11px] tracking-[0.18em] text-primary">今日穿搭</p>
        <CardTitle className="font-heading text-xl leading-snug">
          {outfit.summary}
        </CardTitle>
        <CardDescription>{outfit.why}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <ul className="grid gap-1.5 text-sm">
          {outfit.pieces.map((piece) => (
            <li key={piece} className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              <span>{piece}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-1.5">
          {outfit.colors.map((color) => (
            <Badge key={color} variant="secondary">
              {color}
            </Badge>
          ))}
        </div>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">鞋</dt>
            <dd>{outfit.shoes}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">包</dt>
            <dd>{outfit.bag}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">不要穿</dt>
            <dd>{outfit.avoid}</dd>
          </div>
        </dl>
        <SourceLinks evidence={outfit.evidence} />
      </CardContent>
    </Card>
  )
}
