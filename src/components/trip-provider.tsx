"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { Day, Evidence, Trip } from "@/data/types"
import { applySuggestedPlan, revertImportedPlan } from "@/lib/apply-plan"
import { attachPostsToTrip } from "@/lib/attach-evidence"
import { isPitravelInput } from "@/lib/pitravel"
import { countStops, parseRouteText } from "@/lib/parse-routes"
import { defaultSampleTrip, planFromText } from "@/lib/plan-itinerary"
import type { FetchedPost } from "@/lib/social-posts"

const STORAGE_KEY = "xenia.trip.v11"

type TripContextValue = {
  trip: Trip
  ready: boolean
  error: string | null
  generating: boolean
  generate: (text: string, isSample?: boolean) => Promise<Trip | null>
  importShare: (url: string) => Promise<Trip | null>
  importPosts: (
    text: string,
    target?: { stopId?: string; dayId?: string }
  ) => Promise<{
    attached: { url: string; stopName: string; partialRead: boolean }[]
    unmatched: FetchedPost[]
  } | null>
  resetToSample: () => Trip
  patchEvidence: (evidenceId: string, patch: Partial<Evidence>) => void
  applyProposal: () => void
  revertImported: () => void
}

const TripContext = createContext<TripContextValue | null>(null)

function mapDays(days: Day[], mapList: (list: Evidence[]) => Evidence[]): Day[] {
  return days.map((day) => ({
    ...day,
    outfit: { ...day.outfit, evidence: mapList(day.outfit.evidence) },
    stops: day.stops.map((stop) => ({
      ...stop,
      shops: stop.shops.map((shop) => ({
        ...shop,
        evidence: mapList(shop.evidence),
      })),
      mustBuys: stop.mustBuys.map((item) => ({
        ...item,
        evidence: mapList(item.evidence),
      })),
      photoSpots: stop.photoSpots.map((spot) => ({
        ...spot,
        evidence: mapList(spot.evidence),
      })),
    })),
  }))
}

function applyEvidencePatch(
  trip: Trip,
  evidenceId: string,
  patch: Partial<Evidence>
): Trip {
  const mapList = (list: Evidence[]) =>
    list.map((item) => (item.id === evidenceId ? { ...item, ...patch } : item))

  return {
    ...trip,
    days: mapDays(trip.days, mapList),
    proposal: trip.proposal
      ? {
          ...trip.proposal,
          importedDays: mapDays(trip.proposal.importedDays, mapList),
          suggestedDays: mapDays(trip.proposal.suggestedDays, mapList),
        }
      : trip.proposal,
  }
}

async function requestImport(url: string): Promise<{ trip: Trip; sourceText?: string }> {
  const response = await fetch("/api/pitravel/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  })
  const payload = (await response.json()) as { trip?: Trip; error?: string }
  if (!response.ok || !payload.trip) {
    throw new Error(payload.error || "导入失败")
  }
  return { trip: payload.trip }
}

export function TripProvider({
  children,
  initialTrip,
}: {
  children: ReactNode
  initialTrip: Trip
}) {
  const [trip, setTrip] = useState(initialTrip)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw) as { trip?: Trip }
          const stored = parsed.trip
          if (
            stored?.days?.length &&
            stored.traveler !== "Hologrow" &&
            stored.destination !== "东京"
          ) {
            setTrip(stored)
          }
        }
      } catch {
        setError("本地保存的行程读不出来，已改用导入的贵州行程。")
      }
      setReady(true)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  const persist = useCallback((next: Trip) => {
    setTrip(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ trip: next }))
    } catch {
      setError("浏览器存不下这张配图，行程仍会显示，刷新可能丢失上传。")
    }
  }, [])

  const importShare = useCallback(
    async (url: string) => {
      setGenerating(true)
      setError(null)
      try {
        const result = await requestImport(url)
        persist(result.trip)
        return result.trip
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "导入失败，请检查链接是否公开。")
        return null
      } finally {
        setGenerating(false)
      }
    },
    [persist]
  )

  const importPosts = useCallback(
    async (text: string, target?: { stopId?: string; dayId?: string }) => {
      setGenerating(true)
      setError(null)
      try {
        const response = await fetch("/api/evidence/fetch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        })
        const payload = (await response.json()) as {
          posts?: FetchedPost[]
          error?: string
        }
        if (!response.ok || !payload.posts) {
          setError(payload.error || "公开页读取失败。")
          return null
        }
        const result = attachPostsToTrip(trip, payload.posts, target, text)
        persist(result.trip)
        if (result.unmatched.length > 0 && !target?.stopId) {
          setError("有的链接对不上当前行程里的站名。打开那一站再贴，或在链接旁边写上店名。")
        }
        return { attached: result.attached, unmatched: result.unmatched }
      } catch {
        setError("公开页读取失败，请检查链接。")
        return null
      } finally {
        setGenerating(false)
      }
    },
    [persist, trip]
  )

  const generate = useCallback(
    async (text: string, isSample = false) => {
      if (!isSample && isPitravelInput(text)) {
        return importShare(text)
      }
      const draft = parseRouteText(text)
      if (countStops(draft) === 0) {
        setError("请先贴入至少一处地点，或按天把站点加到右侧列表。")
        return null
      }
      setGenerating(true)
      setError(null)
      try {
        const next = planFromText(text, isSample)
        persist(next)
        return next
      } catch {
        setError("排期失败，请检查粘贴格式后再试。")
        return null
      } finally {
        setGenerating(false)
      }
    },
    [importShare, persist]
  )

  const resetToSample = useCallback(() => {
    const next = defaultSampleTrip()
    persist(next)
    setError(null)
    return next
  }, [persist])

  const revertImported = useCallback(() => {
    persist(revertImportedPlan(trip))
  }, [persist, trip])

  const applyProposal = useCallback(() => {
    persist(applySuggestedPlan(trip))
  }, [persist, trip])

  const patchEvidence = useCallback(
    (evidenceId: string, patch: Partial<Evidence>) => {
      persist(applyEvidencePatch(trip, evidenceId, patch))
    },
    [persist, trip]
  )

  const value = useMemo(
    () => ({
      trip,
      ready,
      error,
      generating,
      generate,
      importShare,
      importPosts,
      resetToSample,
      patchEvidence,
      applyProposal,
      revertImported,
    }),
    [
      trip,
      ready,
      error,
      generating,
      generate,
      importShare,
      importPosts,
      resetToSample,
      patchEvidence,
      applyProposal,
      revertImported,
    ]
  )

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>
}

export function useTrip() {
  const value = useContext(TripContext)
  if (!value) throw new Error("useTrip 必须放在 TripProvider 里")
  return value
}
