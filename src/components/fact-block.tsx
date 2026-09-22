import type { ReactNode } from "react"
import type { FactImage } from "@/data/types"
import { FactImages } from "@/components/fact-images"
import { cn } from "@/lib/utils"

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-[11px] font-medium text-primary", className)}>{children}</p>
}

function hasMedia(images?: FactImage[]) {
  if (!images?.length) return false
  return images.some((item) => Boolean(item.src && !item.missing) || Boolean(item.missing))
}

/** 店铺 / 必买 / 避坑共用：有图才两列，正文永不挤进窄列。 */
export function FactBlock({
  images,
  children,
  className,
}: {
  images?: FactImage[]
  children: ReactNode
  className?: string
}) {
  const media = hasMedia(images)
  return (
    <div
      className={cn(
        "grid w-full min-w-0 gap-3 rounded-2xl border border-border bg-card p-4 sm:p-5",
        media && "sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:items-start",
        className
      )}
    >
      {media ? <FactImages images={images} className="min-w-0" /> : null}
      <div className="min-w-0 max-w-full space-y-2">{children}</div>
    </div>
  )
}

export function Prose({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-pretty text-sm leading-relaxed break-normal", className)}>{children}</p>
}
