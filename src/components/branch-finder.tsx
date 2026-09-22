"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTrip } from "@/components/trip-provider"

export function BranchFinder({ dayId }: { dayId: string }) {
  const { applyMapped, generating } = useTrip()
  const [query, setQuery] = useState("")
  const [message, setMessage] = useState<string | null>(null)

  return (
    <form
      className="grid gap-2 rounded-2xl border border-border bg-card px-4 py-3"
      onSubmit={async (event) => {
        event.preventDefault()
        const name = query.trim()
        if (!name) return
        setMessage(null)
        const result = await applyMapped({ query: name, dayId })
        if (!result) {
          setMessage("没有沿路找到可挂的分店。不会改顺序。")
          return
        }
        setMessage(`${result.place} → ${result.stopName}。${result.why}`)
        setQuery("")
      }}
    >
      <p className="text-[11px] tracking-[0.16em] text-primary">选店 · 沿路挂到已有站</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="店名，例如 滋铁板烧、好心情烤鱼、余美霞"
          disabled={generating}
        />
        <Button type="submit" size="sm" disabled={generating || !query.trim()}>
          挂到当天路上
        </Button>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        只把店挂到绕路最少的已有站，不会重排圆周旅迹。选店结果写进下面时间线和站点要点。
      </p>
      {message ? <p className="text-sm leading-relaxed">{message}</p> : null}
    </form>
  )
}
