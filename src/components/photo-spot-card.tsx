"use client"

import type { PhotoSpot } from "@/data/types"
import { FactImages } from "@/components/fact-images"
import { Copy, Heading, MediaRow, MetaLabel, Panel, PlaceLine } from "@/components/layout-system"
import { OcrLines } from "@/components/ocr-lines"
import { ShotFrame } from "@/components/shot-frame"
import { SourceLinks } from "@/components/source-links"
import { Badge } from "@/components/ui/badge"

export function PhotoSpotCard({ spot, index }: { spot: PhotoSpot; index: number }) {
  const photos = (spot.images ?? []).filter((item) => item.src)
  const media =
    photos.length > 0 ? (
      <FactImages images={spot.images} compact />
    ) : spot.composition ? (
      <ShotFrame composition={spot.composition} />
    ) : null

  return (
    <Panel>
      <MetaLabel>机位 {String(index + 1).padStart(2, "0")}</MetaLabel>
      <Heading as="h3">
        {spot.title}
        {spot.uncertain ? (
          <Badge variant="outline" className="ml-2 align-middle text-[10px] font-normal">
            识别不确定
          </Badge>
        ) : null}
      </Heading>
      <PlaceLine>最佳时段 {spot.bestTime}</PlaceLine>
      <MediaRow media={photos.length > 0 ? media : undefined}>
        {photos.length === 0 && media ? <div className="mb-2 w-full">{media}</div> : null}
        <dl className="flex w-full min-w-0 flex-col gap-3">
          <Fact label="站在哪" value={spot.standWhere} />
          <Fact label="角度" value={spot.angle} />
          <Fact label="画面长这样" value={spot.shotLooksLike} />
          <Fact label="镜头" value={spot.lens} />
          <Fact label="避坑" value={spot.avoid} />
        </dl>
      </MediaRow>
      <OcrLines lines={spot.ocrLines} />
      <SourceLinks evidence={spot.evidence} />
    </Panel>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="w-full min-w-0">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="mt-1">
        <Copy>{value}</Copy>
      </dd>
    </div>
  )
}
