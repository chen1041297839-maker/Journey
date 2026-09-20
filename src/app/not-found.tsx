import Link from "next/link"
import { EmptyState } from "@/components/empty-state"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-16">
      <EmptyState
        title="找不到这一站"
        description="链接可能写错了，或这天还没写进手帐。回到第一天从时间线再点一次。"
      />
      <Link
        href="/"
        className={cn(buttonVariants({ variant: "default" }), "mx-auto mt-4")}
      >
        回到手帐首页
      </Link>
    </main>
  )
}
