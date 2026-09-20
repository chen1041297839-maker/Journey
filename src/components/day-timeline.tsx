"use client"

import Link from "next/link"
import { Camera, Clock3, ShoppingBag } from "lucide-react"
import { walkingLevelLabel } from "@/data/types"
import type { Day } from "@/data/types"
import { OutfitCard } from "@/components/outfit-card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function DayTimeline({
  day,
  activeStopId,
}: {
  day: Day
  activeStopId?: string
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{walkingLevelLabel[day.walkingLevel]}</Badge>
          <Badge variant="outline">{day.weatherVibe.split("，")[0]}</Badge>
        </div>
        <h2 className="mt-3 font-heading text-2xl leading-tight">{day.theme}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {day.walkingNote}
        </p>
        <p className="mt-2 text-sm text-foreground/80">
          街区气质 · {day.neighborhoodStyle}
        </p>
        <p className="mt-3 text-xs tracking-wide text-muted-foreground">
          {day.routeSummary.join(" → ")}
        </p>
      </div>

      <OutfitCard outfit={day.outfit} />

      {day.stops.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          这一天还没有站点。回到首页粘贴圆周旅迹链接，或按天把地点加进去。
        </p>
      ) : (
        <ol className="relative flex flex-col gap-3 border-l border-primary/30 pl-5">
          {day.stops.map((stop) => {
            const active = stop.id === activeStopId
            return (
              <li key={stop.id} className="relative">
                <span
                  className={cn(
                    "absolute top-4 -left-[27px] size-3 rounded-full ring-4 ring-background",
                    active ? "bg-primary" : "bg-foreground/30"
                  )}
                />
                <Link
                  href={`/day/${day.id}/stop/${stop.id}`}
                  className={cn(
                    "block rounded-2xl border bg-card px-4 py-3 transition-colors",
                    active
                      ? "border-primary ring-1 ring-primary/30"
                      : "border-border hover:border-primary/40"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] tracking-[0.14em] text-muted-foreground">
                        {String(stop.order).padStart(2, "0")} · {stop.area}
                      </p>
                      <p className="mt-0.5 font-heading text-lg leading-tight">
                        {stop.name}
                        {stop.nameJa ? (
                          <span className="ml-2 text-sm font-normal text-muted-foreground">
                            {stop.nameJa}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-xs tabular-nums text-muted-foreground">
                      <Clock3 className="size-3.5" />
                      {stop.arrive}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {stop.note}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <ShoppingBag className="size-3" />
                      {stop.shops.length} 店
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Camera className="size-3" />
                      {stop.photoSpots.length} 机位
                    </span>
                    <span>{stop.duration}</span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
