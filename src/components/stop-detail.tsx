"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { Day, MustBuy, Shop, Stop, Warning } from "@/data/types"
import { SectionEmpty } from "@/components/empty-state"
import { FactBlock, Prose, SectionLabel } from "@/components/fact-block"
import { ImageUpload } from "@/components/image-upload"
import { OcrLines } from "@/components/ocr-lines"
import { OutfitCard } from "@/components/outfit-card"
import { PhotoSpotCard } from "@/components/photo-spot-card"
import { PostPaste } from "@/components/post-paste"
import { ReadFlags, SourceLinks } from "@/components/source-links"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { visibleFactNames } from "@/lib/stop-facts"

export function StopDetail({ day, stop }: { day: Day; stop: Stop }) {
  const warnings = stop.warnings ?? []

  return (
    <article className="flex min-w-0 flex-col gap-6 pb-10">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/day/${day.id}`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          <ArrowLeft data-icon="inline-start" />
          返回 {day.title}
        </Link>
      </div>

      <header className="min-w-0">
        <p className="text-[11px] text-muted-foreground">
          DAY {String(day.dayNumber).padStart(2, "0")} · {stop.area} · {stop.arrive} 抵达 ·{" "}
          {stop.duration}
        </p>
        <h2 className="mt-2 font-heading text-2xl leading-tight sm:text-3xl">{stop.name}</h2>
        {stop.nameJa ? (
          <p className="mt-1 text-sm text-muted-foreground">{stop.nameJa}</p>
        ) : null}
        <Prose className="mt-3">{stop.note}</Prose>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="secondary">{stop.vibe}</Badge>
          <Badge variant="outline">{stop.shops.length} 家店</Badge>
          <Badge variant="outline">{stop.mustBuys.length} 件必买</Badge>
          <Badge variant="outline">{stop.photoSpots.length} 个机位</Badge>
          {warnings.length > 0 ? (
            <Badge variant="outline">{warnings.length} 条避坑</Badge>
          ) : null}
        </div>
      </header>

      <ImageUpload dayId={day.id} stopId={stop.id} />

      <ReadFlags flags={stop.readFlags} />

      <OutfitCard outfit={day.outfit} compact />

      <Tabs defaultValue="facts">
        <TabsList variant="line" className="w-full max-w-full justify-start overflow-x-auto">
          <TabsTrigger value="facts">要点</TabsTrigger>
          <TabsTrigger value="spots">机位</TabsTrigger>
          <TabsTrigger value="outfit">穿搭</TabsTrigger>
        </TabsList>

        <TabsContent value="facts" className="mt-4 grid gap-5">
          <HungFacts stop={stop} />
          {warnings.length > 0 ? <WarningList warnings={warnings} /> : null}
          <OcrExcerpt lines={stop.ocrLines} />
          <ShopList shops={stop.shops} />
          <BuyList items={stop.mustBuys} />
          {warnings.length === 0 && stop.shops.length === 0 && stop.mustBuys.length === 0 ? (
            <SectionEmpty
              title="这一站还没有抽出要点"
              hint="把小红书清单截图拖到上面的上传区（不要发到聊天），或在页底贴公开链接。我们抽店、必买、价格和避坑；原帖只留来源。"
            />
          ) : null}
        </TabsContent>

        <TabsContent value="spots" className="mt-4 grid gap-4">
          {stop.photoSpots.length === 0 ? (
            <SectionEmpty
              title="这一站还没有机位"
              hint="补上站位、角度和时段，出门就不用再翻收藏夹。"
            />
          ) : (
            stop.photoSpots.map((spot, index) => (
              <PhotoSpotCard key={spot.id} spot={spot} index={index} />
            ))
          )}
        </TabsContent>

        <TabsContent value="outfit" className="mt-4 grid gap-3">
          <OutfitCard outfit={day.outfit} />
        </TabsContent>
      </Tabs>

      <PostPaste dayId={day.id} stopId={stop.id} />
    </article>
  )
}

function HungFacts({ stop }: { stop: Stop }) {
  const names = visibleFactNames(stop)
  const hung = stop.shops.filter((shop) => shop.mapPick?.why)
  if (names.length === 0 && hung.length === 0) return null
  return (
    <section className="grid min-w-0 gap-2">
      <SectionLabel>这一站要点</SectionLabel>
      <div className="flex flex-wrap gap-2">
        {names.map((name) => (
          <span
            key={name}
            className="max-w-full rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-sm break-normal"
          >
            {name}
          </span>
        ))}
      </div>
      {hung.map((shop) => (
        <Prose key={shop.id} className="text-primary">
          {shop.name}
          {shop.whatToLookFor ? `，${shop.whatToLookFor}` : ""}
          {shop.mapPick?.why ? `。${shop.mapPick.why}` : ""}
        </Prose>
      ))}
    </section>
  )
}

function OcrExcerpt({ lines }: { lines?: Stop["ocrLines"] }) {
  if (!lines?.length) return null
  return (
    <section className="grid min-w-0 gap-2">
      <SectionLabel>配图 OCR</SectionLabel>
      <div className="rounded-2xl border border-dashed border-border bg-card p-4">
        <OcrLines lines={lines} className="mt-0" />
      </div>
    </section>
  )
}

function WarningList({ warnings }: { warnings: Warning[] }) {
  const images = warnings.find((item) => item.images?.some((image) => image.src))?.images
  return (
    <section className="grid min-w-0 gap-2">
      <SectionLabel>避坑</SectionLabel>
      <FactBlock images={images}>
        <ul className="grid gap-2">
          {warnings.map((item) => (
            <li key={item.id} className="text-pretty text-sm leading-relaxed break-normal">
              <span className="mr-2 font-heading text-primary">{item.kind}</span>
              {item.text}
            </li>
          ))}
        </ul>
      </FactBlock>
    </section>
  )
}

function ShopList({ shops }: { shops: Shop[] }) {
  if (shops.length === 0) return null
  return (
    <section className="grid min-w-0 gap-3">
      <SectionLabel>店铺</SectionLabel>
      <div className="grid gap-3">
        {shops.map((shop) => (
          <FactBlock key={shop.id} images={shop.images}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <p className="font-heading text-lg leading-tight break-normal">
                {shop.name}
                {shop.uncertain ? (
                  <Badge variant="outline" className="ml-2 align-middle text-[10px] font-normal">
                    识别不确定
                  </Badge>
                ) : null}
              </p>
              <span className="text-xs text-muted-foreground">{shop.hours}</span>
            </div>
            <p className="text-xs text-primary">{shop.category}</p>
            <Prose>{shop.note}</Prose>
            {shop.mapPick?.why ? <Prose className="text-primary">地图：{shop.mapPick.why}</Prose> : null}
            {shop.whatToLookFor ? (
              <Prose className="text-muted-foreground">找什么：{shop.whatToLookFor}</Prose>
            ) : null}
            <OcrLines lines={shop.ocrLines} />
            <SourceLinks evidence={shop.evidence} className="mt-1" />
          </FactBlock>
        ))}
      </div>
    </section>
  )
}

function BuyList({ items }: { items: MustBuy[] }) {
  if (items.length === 0) return null
  return (
    <section className="grid min-w-0 gap-3">
      <SectionLabel>必买</SectionLabel>
      <div className="grid gap-3">
        {items.map((item) => (
          <FactBlock key={item.id} images={item.images}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <p className="font-heading text-lg leading-tight break-normal">
                {item.name}
                {item.uncertain ? (
                  <Badge variant="outline" className="ml-2 align-middle text-[10px] font-normal">
                    识别不确定
                  </Badge>
                ) : null}
              </p>
              <span className="text-xs text-primary">{item.budget}</span>
            </div>
            <Prose>{item.reason}</Prose>
            {item.mapPick?.why ? <Prose className="text-primary">地图：{item.mapPick.why}</Prose> : null}
            {item.tip ? <Prose className="text-muted-foreground">提醒：{item.tip}</Prose> : null}
            <OcrLines lines={item.ocrLines} />
            <SourceLinks evidence={item.evidence} className="mt-1" />
          </FactBlock>
        ))}
      </div>
    </section>
  )
}
