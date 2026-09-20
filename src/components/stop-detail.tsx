"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { Day, Stop } from "@/data/types"
import { EvidenceRow } from "@/components/evidence-card"
import { SectionEmpty } from "@/components/empty-state"
import { OutfitCard } from "@/components/outfit-card"
import { PhotoSpotCard } from "@/components/photo-spot-card"
import { useTrip } from "@/components/trip-provider"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export function StopDetail({ day, stop }: { day: Day; stop: Stop }) {
  const { patchEvidence } = useTrip()

  return (
    <article className="flex flex-col gap-6 pb-10">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/day/${day.id}`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          <ArrowLeft data-icon="inline-start" />
          返回 {day.title}
        </Link>
      </div>

      <header>
        <p className="text-[11px] tracking-[0.18em] text-muted-foreground">
          DAY {String(day.dayNumber).padStart(2, "0")} · {stop.area} · {stop.arrive} 抵达 ·{" "}
          {stop.duration}
        </p>
        <h2 className="mt-2 font-heading text-3xl leading-none">{stop.name}</h2>
        {stop.nameJa ? (
          <p className="mt-1 text-sm text-muted-foreground">{stop.nameJa}</p>
        ) : null}
        <p className="mt-3 text-sm leading-relaxed">{stop.note}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="secondary">{stop.vibe}</Badge>
          <Badge variant="outline">{stop.shops.length} 家店</Badge>
          <Badge variant="outline">{stop.mustBuys.length} 件必买</Badge>
          <Badge variant="outline">{stop.photoSpots.length} 个机位</Badge>
        </div>
      </header>

      <OutfitCard outfit={day.outfit} compact />

      <Tabs defaultValue="spots">
        <TabsList variant="line" className="w-full max-w-full justify-start overflow-x-auto">
          <TabsTrigger value="spots">机位</TabsTrigger>
          <TabsTrigger value="shops">店铺</TabsTrigger>
          <TabsTrigger value="buys">必买</TabsTrigger>
          <TabsTrigger value="outfit">穿搭证据</TabsTrigger>
        </TabsList>

        <TabsContent value="spots" className="mt-4 grid gap-4">
          {stop.photoSpots.length === 0 ? (
            <SectionEmpty
              title="这一站还没有机位"
              hint="补上站位、角度和画面说明，出门就不用再翻收藏夹。"
            />
          ) : (
            stop.photoSpots.map((spot, index) => (
              <PhotoSpotCard key={spot.id} spot={spot} index={index} />
            ))
          )}
        </TabsContent>

        <TabsContent value="shops" className="mt-4 grid gap-3">
          {stop.shops.length === 0 ? (
            <SectionEmpty
              title="这里不购物"
              hint="酒店、机场这类节点通常没有店。买东西看前后一站。"
            />
          ) : (
            stop.shops.map((shop) => (
              <div
                key={shop.id}
                className="rounded-2xl border border-border bg-card px-4 py-3"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-heading text-lg">{shop.name}</p>
                  <span className="text-xs text-muted-foreground">{shop.hours}</span>
                </div>
                <p className="mt-1 text-xs tracking-wide text-primary">{shop.category}</p>
                <p className="mt-2 text-sm leading-relaxed">{shop.note}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  找什么 · {shop.whatToLookFor}
                </p>
                <div className="mt-3">
                  <EvidenceRow
                    evidence={shop.evidence}
                    onChangeAt={(index, patch) =>
                      patchEvidence(shop.evidence[index].id, patch)
                    }
                  />
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="buys" className="mt-4 grid gap-3">
          {stop.mustBuys.length === 0 ? (
            <SectionEmpty
              title="这一站没有必买"
              hint="省下行李箱。真想带手信，看相邻站点。"
            />
          ) : (
            stop.mustBuys.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-border bg-card px-4 py-3"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-heading text-lg">{item.name}</p>
                  <span className="text-xs tabular-nums text-primary">{item.budget}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed">{item.reason}</p>
                <p className="mt-2 text-sm text-muted-foreground">提醒 · {item.tip}</p>
                <div className="mt-3">
                  <EvidenceRow
                    evidence={item.evidence}
                    onChangeAt={(index, patch) =>
                      patchEvidence(item.evidence[index].id, patch)
                    }
                  />
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="outfit" className="mt-4 grid gap-3">
          <OutfitCard outfit={day.outfit} />
        </TabsContent>
      </Tabs>
    </article>
  )
}
