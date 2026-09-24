"use client"

import Link from "next/link"
import { useTrip } from "@/components/trip-provider"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function TripHeader() {
  const { trip, ready } = useTrip()
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex w-full min-w-0 max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="min-w-0">
          <p className="truncate text-sm font-medium">
            {ready ? trip.traveler : "Xenia"}
            <span className="font-normal text-muted-foreground">
              {" "}
              · {ready ? trip.destination : "行程"}
            </span>
          </p>
        </Link>
        <div className="flex shrink-0 items-center gap-3">
          <p className="hidden text-xs text-muted-foreground sm:block">
            {trip.datesLabel}
            {trip.isSampleRoute ? " · 示例" : ""}
          </p>
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            修改路线
          </Link>
        </div>
      </div>
    </header>
  )
}

export function SourceNote({ className }: { className?: string }) {
  const { trip } = useTrip()
  return (
    <p className={cn("cjk-flow text-xs leading-6 text-muted-foreground", className)}>
      {trip.sourceNote}
    </p>
  )
}
