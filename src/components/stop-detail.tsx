"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { Day, MustBuy, Shop, Stop, Warning } from "@/data/types"
import { SectionEmpty } from "@/components/empty-state"
import { FactBlock, SectionLabel } from "@/components/fact-block"
import { ImageUpload } from "@/components/image-upload"
import { Copy, Heading, PlaceLine, Stack } from "@/components/layout-system"
import { OcrLines } from "@/components/ocr-lines"
import { OutfitCard } from "@/components/outfit-card"
import { PhotoSpotCard } from "@/components/photo-spot-card"
import { PostPaste } from "@/components/post-paste"
import { ReadFlags, SourceLinks } from "@/components/source-links"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { repeats } from "@/lib/stop-facts"

export function StopDetail({ day, stop }: { day: Day; stop: Stop }) {
  const covered = [day.planNote, day.walkingNote, stop.note].filter(Boolean).join("\n")
  const warnings = (stop.warnings ?? []).filter((item) => !repeats(item.text, covered))
  const showNote = Boolean(stop.note) && !repeats(stop.note, `${day.planNote}\n${day.walkingNote}`)

  return (
    <article className="flex w-full min-w-0 flex-col gap-8 pb-12">
      <Link
        href={`/day/${day.id}`}
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit lg:hidden")}
      >
        <ArrowLeft data-icon="inline-start" />
        返回这一天
      </Link>

      <header className="flex w-full min-w-0 flex-col gap-2">
        <p className="cjk-flow text-sm text-muted-foreground">
          {stop.arrive} · {stop.duration}
        </p>
        <Heading as="h2" className="text-2xl">
          {stop.name}
        </Heading>
        {stop.nameJa ? <PlaceLine className="text-muted-foreground">{stop.nameJa}</PlaceLine> : null}
        {showNote ? <Copy>{stop.note}</Copy> : null}
      </header>

      <ReadFlags flags={(stop.readFlags ?? []).filter((flag) => !/上传|拖到|拖入/.test(flag))} />

      <Tabs defaultValue="facts" className="w-full min-w-0">
        <TabsList variant="line" className="h-auto w-full max-w-full justify-start overflow-x-auto">
          <TabsTrigger value="facts" className="flex-none px-3">
            要点
          </TabsTrigger>
          <TabsTrigger value="spots" className="flex-none px-3">
            机位
          </TabsTrigger>
          <TabsTrigger value="outfit" className="flex-none px-3">
            穿搭
          </TabsTrigger>
        </TabsList>

        <TabsContent value="facts" className="mt-6">
          <Stack gap="lg">
            {warnings.length > 0 ? <WarningList warnings={warnings} /> : null}
            <OcrExcerpt lines={linesNotInChildren(stop)} />
            <ShopList shops={stop.shops} />
            <BuyList items={stop.mustBuys} shops={stop.shops} />
            {warnings.length === 0 && stop.shops.length === 0 && stop.mustBuys.length === 0 ? (
              <SectionEmpty
                title="这一站还没有抽出要点"
                hint="把小红书清单截图拖到上面的上传区（不要发到聊天），或在页底贴公开链接。我们抽店、必买、价格和避坑；原帖只留来源。"
              />
            ) : null}
          </Stack>
        </TabsContent>

        <TabsContent value="spots" className="mt-6">
          <Stack gap="md">
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
          </Stack>
        </TabsContent>

        <TabsContent value="outfit" className="mt-6">
          <OutfitCard outfit={day.outfit} />
        </TabsContent>
      </Tabs>

      <ImageUpload dayId={day.id} stopId={stop.id} />
      <PostPaste dayId={day.id} stopId={stop.id} />
    </article>
  )
}

function linesNotInChildren(stop: Stop) {
  const covered = new Set(
    [...stop.shops, ...stop.mustBuys]
      .flatMap((item) => item.ocrLines ?? [])
      .map((line) => line.text)
  )
  return (stop.ocrLines ?? []).filter((line) => !covered.has(line.text))
}

function OcrExcerpt({ lines }: { lines?: Stop["ocrLines"] }) {
  if (!lines?.length) return null
  return (
    <section className="flex w-full min-w-0 flex-col gap-3">
      <SectionLabel>配图 OCR</SectionLabel>
      <div className="panel">
        <OcrLines lines={lines} className="mt-0" />
      </div>
    </section>
  )
}

function WarningList({ warnings }: { warnings: Warning[] }) {
  const images = warnings.find((item) => item.images?.some((image) => image.src))?.images
  return (
    <section className="flex w-full min-w-0 flex-col gap-3">
      <SectionLabel>避坑</SectionLabel>
      <FactBlock images={images}>
        <ul className="flex w-full min-w-0 flex-col gap-3">
          {warnings.map((item) => (
            <li key={item.id} className="cjk-flow text-sm leading-7">
              <span className="mr-2 font-medium">{item.kind}</span>
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
    <section className="flex w-full min-w-0 flex-col gap-4">
      <SectionLabel>店铺</SectionLabel>
      <Stack gap="md">
        {shops.map((shop) => (
          <FactBlock key={shop.id} images={shop.images}>
            <MetaBits>
              <Heading as="h3">{shop.name}</Heading>
              {shop.uncertain ? (
                <Badge variant="outline" className="w-fit text-[10px] font-normal">
                  识别不确定
                </Badge>
              ) : null}
            </MetaBits>
            <PlaceLine>
              {shop.category}
              {shop.hours ? ` · ${shop.hours}` : ""}
            </PlaceLine>
            <Copy>{shop.note}</Copy>
            {shop.mapPick?.why ? <Copy muted>地图：{shop.mapPick.why}</Copy> : null}
            {shop.whatToLookFor ? <Copy muted>找什么：{shop.whatToLookFor}</Copy> : null}
            <OcrLines lines={shop.ocrLines} />
            <SourceLinks evidence={shop.evidence} />
          </FactBlock>
        ))}
      </Stack>
    </section>
  )
}

function BuyList({ items, shops }: { items: MustBuy[]; shops: Shop[] }) {
  if (items.length === 0) return null
  const said = new Set(shops.map((shop) => shop.mapPick?.why).filter(Boolean))
  return (
    <section className="flex w-full min-w-0 flex-col gap-4">
      <SectionLabel>必买</SectionLabel>
      <Stack gap="md">
        {items.map((item) => (
          <FactBlock key={item.id} images={item.images}>
            <MetaBits>
              <Heading as="h3">{item.name}</Heading>
              {item.uncertain ? (
                <Badge variant="outline" className="w-fit text-[10px] font-normal">
                  识别不确定
                </Badge>
              ) : null}
            </MetaBits>
            {item.budget ? <PlaceLine>{item.budget}</PlaceLine> : null}
            <Copy>{item.reason}</Copy>
            {item.mapPick?.why && !said.has(item.mapPick.why) ? (
              <Copy muted>地图：{item.mapPick.why}</Copy>
            ) : null}
            {item.tip ? <Copy muted>提醒：{item.tip}</Copy> : null}
            <OcrLines lines={item.ocrLines} />
            <SourceLinks evidence={item.evidence} />
          </FactBlock>
        ))}
      </Stack>
    </section>
  )
}

function MetaBits({ children }: { children: ReactNode }) {
  return <div className="flex w-full min-w-0 flex-col gap-2">{children}</div>
}
