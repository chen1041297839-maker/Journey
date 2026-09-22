import type { FactImage } from "@/data/types"
import { cn } from "@/lib/utils"

export function FactImages({
  images,
  className,
}: {
  images?: FactImage[]
  className?: string
}) {
  const list = images ?? []
  const visible = list.filter((item) => item.src && !item.missing)
  const missingCount = list.reduce((sum, item) => sum + (item.missing ? item.missingCount || 1 : 0), 0)

  if (visible.length === 0 && missingCount === 0) return null

  return (
    <div className={cn("grid min-w-0 gap-1.5", className)}>
      {visible.length > 0 ? (
        <div className={cn("grid gap-1.5", visible.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
          {visible.slice(0, 4).map((item) => (
            // Local /evidence files and user data URLs are not run through next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={item.src}
              src={item.src}
              alt={item.alt}
              className="aspect-[4/5] w-full max-w-full rounded-lg bg-muted object-cover"
            />
          ))}
        </div>
      ) : null}
      {missingCount > 0 ? (
        <p className="text-pretty text-[11px] leading-relaxed break-normal text-muted-foreground">
          {visible.length > 0
            ? `另有 ${missingCount} 张配图读不到，把清单截图拖到上面上传区`
            : "配图读不到，把清单截图拖到上面上传区"}
        </p>
      ) : null}
    </div>
  )
}
