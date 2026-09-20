"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"

export default function GlobalError({
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
        title="行程暂时打不开"
        description="页面出错了。再试一次，或回到首页重新导入分享链接。"
      />
      <Button className="mx-auto mt-4" onClick={() => reset()}>
        重试
      </Button>
    </main>
  )
}
