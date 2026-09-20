import Link from "next/link"
import { formatDayDate, getTrip } from "@/data"
import { cn } from "@/lib/utils"

export function TripHeader() {
  const trip = getTrip()
  return (
    <header className="relative overflow-hidden border-b border-border/80">
      <div className="pointer-events-none absolute -right-8 -top-10 size-36 rounded-full bg-primary/12 blur-2xl" />
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:py-8">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-[11px] tracking-[0.22em] text-muted-foreground uppercase">
            <span>{trip.traveler}</span>
            <span className="text-primary">·</span>
            <span>{trip.destination}</span>
          </div>
          <Link href="/" className="mt-2 inline-block">
            <h1 className="font-heading text-3xl leading-none tracking-tight sm:text-4xl">
              {trip.title}
            </h1>
          </Link>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {trip.intro}
          </p>
        </div>
        <div className="flex items-end gap-4">
          <div className="seal" aria-hidden>
            手帐
          </div>
          <div className="text-right">
            <p className="font-heading text-2xl tabular-nums">{trip.datesLabel}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDayDate(trip.startDate)}出发 · {trip.days.length} 天
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}

export function SourceNote({ className }: { className?: string }) {
  const trip = getTrip()
  return (
    <p className={cn("text-xs leading-relaxed text-muted-foreground", className)}>
      {trip.sourceNote}
    </p>
  )
}
