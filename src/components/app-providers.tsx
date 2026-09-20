"use client"

import type { ReactNode } from "react"
import type { Trip } from "@/data/types"
import { TripProvider } from "@/components/trip-provider"

export function AppProviders({
  children,
  initialTrip,
}: {
  children: ReactNode
  initialTrip: Trip
}) {
  return <TripProvider initialTrip={initialTrip}>{children}</TripProvider>
}
