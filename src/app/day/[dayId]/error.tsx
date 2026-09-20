"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"

export default function DayError({
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
        title="这一天打不开"
        description="行程页加载失败。回到首页重新导入圆周旅迹链接，或点下面重试。"
      />
      <Button className="mx-auto mt-4" onClick={() => reset()}>
        重新打开
      </Button>
    </main>
  )
}
