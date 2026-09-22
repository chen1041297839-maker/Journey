"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy, MetaLabel } from "@/components/layout-system"
import { useTrip } from "@/components/trip-provider"

export function BranchFinder({ dayId }: { dayId: string }) {
  const { applyMapped, generating } = useTrip()
  const [query, setQuery] = useState("")
  const [message, setMessage] = useState<string | null>(null)

  return (
    <form
      className="panel"
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
      <MetaLabel>选店 · 沿路挂到已有站</MetaLabel>
      <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="店名，例如 滋铁板烧、好心情烤鱼、余美霞"
          disabled={generating}
        />
        <Button type="submit" size="sm" className="shrink-0" disabled={generating || !query.trim()}>
          挂到当天路上
        </Button>
      </div>
      <Copy muted className="text-xs leading-6">
        只把店挂到绕路最少的已有站，不会重排圆周旅迹。选店结果写进下面时间线和站点要点。
      </Copy>
      {message ? <Copy>{message}</Copy> : null}
    </form>
  )
}
