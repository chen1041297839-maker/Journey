import type { ReactNode } from "react"
import type { FactImage } from "@/data/types"
import { FactImages } from "@/components/fact-images"
import { Copy, MediaRow, MetaLabel, Panel } from "@/components/layout-system"
import { cn } from "@/lib/utils"

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <MetaLabel className={className}>{children}</MetaLabel>
}

function hasMedia(images?: FactImage[]) {
  if (!images?.length) return false
  return images.some((item) => Boolean(item.src && !item.missing) || Boolean(item.missing))
}

/** 店铺 / 必买 / 避坑：有图才并排，正文始终占满卡片剩余宽度。 */
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
    <Panel className={className}>
      <MediaRow media={media ? <FactImages images={images} compact /> : undefined}>
        {children}
      </MediaRow>
    </Panel>
  )
}

export function Prose({ children, className }: { children: ReactNode; className?: string }) {
  return <Copy className={cn(className)}>{children}</Copy>
}
