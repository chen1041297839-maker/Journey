"use client"

import type { Outfit } from "@/data/types"
import { FactImages } from "@/components/fact-images"
import { Copy, Heading, MetaLabel, Panel } from "@/components/layout-system"
import { SourceLinks } from "@/components/source-links"
import { Badge } from "@/components/ui/badge"

export function OutfitCard({
  outfit,
  compact = false,
}: {
  outfit: Outfit
  compact?: boolean
}) {
  if (compact) {
    return (
      <Panel className="gap-2 py-4">
        <MetaLabel>当日穿搭</MetaLabel>
        <p className="cjk-flow font-heading text-sm leading-7">{outfit.summary}</p>
        <Copy muted className="text-xs leading-6">
          鞋 · {outfit.shoes}
        </Copy>
      </Panel>
    )
  }

  return (
    <Panel>
      <MetaLabel>今日穿搭</MetaLabel>
      <Heading as="h3">{outfit.summary}</Heading>
      <Copy muted>{outfit.why}</Copy>
      <ul className="flex w-full min-w-0 flex-col gap-2 text-sm leading-7">
        {outfit.pieces.map((piece) => (
          <li key={piece} className="flex w-full min-w-0 gap-2">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground/40" />
            <span className="min-w-0 flex-1">{piece}</span>
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
      <dl className="flex w-full min-w-0 flex-col gap-3 text-sm">
        <div className="w-full min-w-0">
          <dt className="text-[11px] text-muted-foreground">鞋</dt>
          <dd className="mt-1">
            <Copy>{outfit.shoes}</Copy>
          </dd>
        </div>
        <div className="w-full min-w-0">
          <dt className="text-[11px] text-muted-foreground">包</dt>
          <dd className="mt-1">
            <Copy>{outfit.bag}</Copy>
          </dd>
        </div>
        <div className="w-full min-w-0">
          <dt className="text-[11px] text-muted-foreground">不要穿</dt>
          <dd className="mt-1">
            <Copy>{outfit.avoid}</Copy>
          </dd>
        </div>
      </dl>
      <SourceLinks evidence={outfit.evidence} />
      <FactImages images={outfit.images} />
    </Panel>
  )
}
