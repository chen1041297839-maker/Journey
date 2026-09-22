import Link from "next/link"
import { formatDayDate } from "@/lib/format-date"
import type { Day } from "@/data/types"
import { cn } from "@/lib/utils"

export function DaySwitcher({
  days,
  activeDayId,
}: {
  days: Day[]
  activeDayId: string
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:thin]">
      <div className="flex w-max gap-2 pb-3">
        {days.map((day) => {
          const active = day.id === activeDayId
          return (
            <Link
              key={day.id}
              href={`/day/${day.id}`}
              className={cn(
                "min-w-[148px] shrink-0 rounded-2xl border px-4 py-3 transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:border-primary/40 hover:bg-accent"
              )}
            >
              <p
                className={cn(
                    "text-[11px]",
                  active ? "text-primary-foreground/80" : "text-muted-foreground"
                )}
              >
                DAY {String(day.dayNumber).padStart(2, "0")} · {day.weekday}
              </p>
              <p className="mt-1 font-heading text-lg leading-tight">{day.title}</p>
              <p
                className={cn(
                  "mt-1 text-xs",
                  active ? "text-primary-foreground/75" : "text-muted-foreground"
                )}
              >
                {formatDayDate(day.date)}
              </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
