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
import type { Evidence, Trip } from "@/data/types"
import { isPitravelInput } from "@/lib/pitravel"
import type { FetchedPost } from "@/lib/social-posts"

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
    attached: {
      url: string
      stopName: string
      partialRead: boolean
      ocrCount: number
      imageCount: number
    }[]
    unmatched: FetchedPost[]
  } | null>
  importUploads: (
    files: File[],
    target: { dayId: string; stopId: string }
  ) => Promise<{ stopName: string; ocrCount: number; imageCount: number } | null>
  resetToSample: () => Promise<Trip | null>
  patchEvidence: (evidenceId: string, patch: Partial<Evidence>) => Promise<void>
  applyProposal: () => Promise<void>
  revertImported: () => Promise<void>
}

const TripContext = createContext<TripContextValue | null>(null)

async function readJson(response: Response): Promise<{ trip?: Trip; error?: string } & Record<string, unknown>> {
  return (await response.json()) as { trip?: Trip; error?: string } & Record<string, unknown>
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
    let cancelled = false
    async function hydrate() {
      try {
        const response = await fetch("/api/journey", { cache: "no-store" })
        const payload = (await response.json()) as { trip?: Trip; error?: string }
        if (!cancelled && response.ok && payload.trip?.days?.length) {
          setTrip(payload.trip)
        } else if (!cancelled && !response.ok) {
          setError(payload.error || "共享行程读不出来，先显示导入快照。")
        }
      } catch {
        if (!cancelled) setError("共享行程读不出来，先显示导入快照。")
      } finally {
        if (!cancelled) setReady(true)
      }
    }
    void hydrate()
    return () => {
      cancelled = true
    }
  }, [])

  const applyServerTrip = useCallback((next: Trip | undefined) => {
    if (!next?.days?.length) return false
    setTrip(next)
    return true
  }, [])

  const importShare = useCallback(
    async (url: string) => {
      setGenerating(true)
      setError(null)
      try {
        const response = await fetch("/api/pitravel/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        })
        const payload = await readJson(response)
        if (!response.ok || !applyServerTrip(payload.trip)) {
          setError(payload.error || "导入失败，请检查链接是否公开。")
          return null
        }
        return payload.trip as Trip
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "导入失败，请检查链接是否公开。")
        return null
      } finally {
        setGenerating(false)
      }
    },
    [applyServerTrip]
  )

  const importPosts = useCallback(
    async (text: string, target?: { stopId?: string; dayId?: string }) => {
      setGenerating(true)
      setError(null)
      try {
        const response = await fetch("/api/evidence/fetch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, dayId: target?.dayId, stopId: target?.stopId }),
        })
        const payload = (await response.json()) as {
          trip?: Trip
          error?: string
          attached?: {
            url: string
            stopName: string
            partialRead: boolean
            ocrCount: number
            imageCount: number
          }[]
          unmatched?: FetchedPost[]
        }
        if (!response.ok || !payload.trip) {
          setError(payload.error || "公开页读取失败。")
          return null
        }
        applyServerTrip(payload.trip)
        if ((payload.unmatched?.length || 0) > 0 && !target?.stopId) {
          setError("有的链接对不上当前行程里的站名。打开那一站再贴，或在链接旁边写上店名。")
        }
        return { attached: payload.attached ?? [], unmatched: payload.unmatched ?? [] }
      } catch {
        setError("公开页读取失败，请检查链接。")
        return null
      } finally {
        setGenerating(false)
      }
    },
    [applyServerTrip]
  )

  const importUploads = useCallback(
    async (files: File[], target: { dayId: string; stopId: string }) => {
      setGenerating(true)
      setError(null)
      try {
        const body = new FormData()
        body.append("dayId", target.dayId)
        body.append("stopId", target.stopId)
        for (const file of files) body.append("images", file)
        const response = await fetch("/api/evidence/ocr", { method: "POST", body })
        const payload = (await response.json()) as {
          trip?: Trip
          error?: string
          stopName?: string
          ocrCount?: number
          imageCount?: number
        }
        if (!response.ok || !payload.trip) {
          setError(payload.error || "截图 OCR 失败。")
          return null
        }
        applyServerTrip(payload.trip)
        return {
          stopName: payload.stopName || "",
          ocrCount: payload.ocrCount ?? 0,
          imageCount: payload.imageCount ?? files.length,
        }
      } catch {
        setError("截图 OCR 失败。")
        return null
      } finally {
        setGenerating(false)
      }
    },
    [applyServerTrip]
  )

  const generate = useCallback(
    async (text: string, isSample = false) => {
      if (!isSample && isPitravelInput(text)) {
        return importShare(text)
      }
      setGenerating(true)
      setError(null)
      try {
        const response = await fetch("/api/journey/mutate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, isSample }),
        })
        const payload = await readJson(response)
        if (!response.ok || !applyServerTrip(payload.trip)) {
          setError(payload.error || "排期失败，请检查粘贴格式后再试。")
          return null
        }
        return payload.trip as Trip
      } catch {
        setError("排期失败，请检查粘贴格式后再试。")
        return null
      } finally {
        setGenerating(false)
      }
    },
    [applyServerTrip, importShare]
  )

  const resetToSample = useCallback(async () => {
    setGenerating(true)
    setError(null)
    try {
      const response = await fetch("/api/journey/mutate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      })
      const payload = await readJson(response)
      if (!response.ok || !applyServerTrip(payload.trip)) {
        setError(payload.error || "无法重置示例行程。")
        return null
      }
      return payload.trip as Trip
    } catch {
      setError("无法重置示例行程。")
      return null
    } finally {
      setGenerating(false)
    }
  }, [applyServerTrip])

  const planAction = useCallback(
    async (action: "apply" | "revert" | "keep") => {
      setGenerating(true)
      setError(null)
      try {
        const response = await fetch("/api/journey/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        })
        const payload = await readJson(response)
        if (!response.ok || !applyServerTrip(payload.trip)) {
          setError(payload.error || "规划选择没有保存。")
        }
      } catch {
        setError("规划选择没有保存。")
      } finally {
        setGenerating(false)
      }
    },
    [applyServerTrip]
  )

  const revertImported = useCallback(async () => {
    await planAction("revert")
  }, [planAction])

  const applyProposal = useCallback(async () => {
    await planAction("apply")
  }, [planAction])

  const patchEvidence = useCallback(
    async (evidenceId: string, patch: Partial<Evidence>) => {
      setError(null)
      try {
        const response = await fetch("/api/journey/mutate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "patch-evidence", evidenceId, patch }),
        })
        const payload = await readJson(response)
        if (!response.ok || !applyServerTrip(payload.trip)) {
          setError(payload.error || "来源没有保存。")
        }
      } catch {
        setError("来源没有保存。")
      }
    },
    [applyServerTrip]
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
      importUploads,
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
      importUploads,
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
