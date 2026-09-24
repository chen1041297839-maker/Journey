import Link from "next/link"
import type { Day } from "@/data/types"
import { cn } from "@/lib/utils"

function dayLabel(day: Day) {
  const parts = day.title.split("·").map((part) => part.trim()).filter(Boolean)
  return parts.at(-1) || day.title
}

export function DaySwitcher({
  days,
  activeDayId,
}: {
  days: Day[]
  activeDayId: string
}) {
  return (
    <div className="sticky top-0 z-20 -mx-4 border-b border-border bg-background/95 px-4 backdrop-blur-sm sm:-mx-6 sm:px-6">
      <nav aria-label="选择一天" className="flex gap-1 overflow-x-auto">
        {days.map((day) => {
          const active = day.id === activeDayId
          return (
            <Link
              key={day.id}
              href={`/day/${day.id}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "shrink-0 border-b-2 px-3 py-3 text-sm transition-colors",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="tabular-nums">{String(day.dayNumber).padStart(2, "0")}</span>
              <span className="ml-2">{dayLabel(day)}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
