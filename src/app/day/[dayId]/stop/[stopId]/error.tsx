"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"

export default function StopError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-16">
      <EmptyState
        title="这一站打不开"
        description="站点页出错了，不会整份行程一起崩。回到时间线再点一次，或重新导入圆周旅迹链接。"
      />
      <Button className="mx-auto mt-4" onClick={() => reset()}>
        重新打开这一站
      </Button>
    </main>
  )
}
