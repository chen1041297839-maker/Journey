"use client"

import type { PhotoSpot } from "@/data/types"
import { FactImages } from "@/components/fact-images"
import { OcrLines } from "@/components/ocr-lines"
import { ShotFrame } from "@/components/shot-frame"
import { SourceLinks } from "@/components/source-links"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function PhotoSpotCard({ spot, index }: { spot: PhotoSpot; index: number }) {
  const photos = (spot.images ?? []).filter((item) => item.src)
  return (
    <Card className="bg-card">
      <CardHeader className="border-b">
        <p className="text-[11px] font-medium text-primary">
          机位 {String(index + 1).padStart(2, "0")}
        </p>
        <CardTitle className="font-heading text-xl leading-tight break-normal">
          {spot.title}
          {spot.uncertain ? (
            <Badge variant="outline" className="ml-2 align-middle text-[10px] font-normal">
              识别不确定
            </Badge>
          ) : null}
        </CardTitle>
        <CardDescription>最佳时段 {spot.bestTime}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid min-w-0 w-full gap-5 sm:grid-cols-[minmax(0,160px)_minmax(0,1fr)] sm:items-start">
          {photos.length > 0 ? (
            <FactImages images={spot.images} />
          ) : (
            <div className="grid gap-2">
              <ShotFrame composition={spot.composition ?? undefined} />
              <FactImages images={spot.images} />
            </div>
          )}
          <dl className="grid gap-3 text-sm">
            <Fact label="站在哪" value={spot.standWhere} />
            <Fact label="角度" value={spot.angle} />
            <Fact label="画面长这样" value={spot.shotLooksLike} />
            <Fact label="镜头" value={spot.lens} />
            <Fact label="避坑" value={spot.avoid} />
          </dl>
        </div>
        <OcrLines lines={spot.ocrLines} />
        <SourceLinks evidence={spot.evidence} />
      </CardContent>
    </Card>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-pretty leading-relaxed break-normal text-foreground">{value}</dd>
    </div>
  )
}
