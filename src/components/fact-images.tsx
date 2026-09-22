import type { FactImage } from "@/data/types"
import { cn } from "@/lib/utils"

export function FactImages({
  images,
  className,
  compact = false,
}: {
  images?: FactImage[]
  className?: string
  compact?: boolean
}) {
  const list = images ?? []
  const visible = list.filter((item) => item.src && !item.missing)
  const missingCount = list.reduce((sum, item) => sum + (item.missing ? item.missingCount || 1 : 0), 0)

  if (visible.length === 0 && missingCount === 0) return null

  return (
    <div className={cn("flex w-full min-w-0 flex-col gap-2", className)}>
      {visible.length > 0 ? (
        <div className="flex w-full min-w-0 flex-col gap-2">
          {visible.slice(0, compact ? 2 : 4).map((item) => (
            // Local /evidence files and user data URLs are not run through next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={item.src}
              src={item.src}
              alt={item.alt}
              className={cn(
                "w-full max-w-full rounded-lg bg-muted object-cover",
                compact ? "aspect-[4/5]" : "max-h-56"
              )}
            />
          ))}
        </div>
      ) : null}
      {missingCount > 0 ? (
        <p className="cjk-flow text-[11px] leading-6 text-muted-foreground">
          {visible.length > 0
            ? `另有 ${missingCount} 张配图读不到，把清单截图拖到上面上传区。`
            : "配图读不到，把清单截图拖到上面上传区。"}
        </p>
      ) : null}
    </div>
  )
}
