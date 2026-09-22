import type { Evidence } from "@/data/types"
import { platformLabel } from "@/data/types"
import { uniqueByUrl } from "@/lib/evidence"
import { cn } from "@/lib/utils"

export function SourceLinks({
  evidence,
  className,
}: {
  evidence: Evidence[]
  className?: string
}) {
  const sources = uniqueByUrl(evidence ?? [])
  if (sources.length === 0) return null
  return (
    <ul className={cn("flex min-w-0 flex-wrap gap-x-3 gap-y-1", className)}>
      {sources.map((item) => {
          const uploaded = item.collectedBy === "upload" || item.url.startsWith("xenia://")
          return (
            <li key={item.id}>
              {uploaded || !/^https?:/i.test(item.url) ? (
                <span className="text-[11px] text-muted-foreground">来源 · 上传截图</span>
              ) : (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
                >
                  来源 · {platformLabel[item.platform]}
                  {item.imageListPartial ? " · 配图清单网页读不全" : item.partialRead ? " · 网页读不全" : ""}
                </a>
              )}
            </li>
          )
        })}
    </ul>
  )
}

export function ReadFlags({ flags }: { flags?: string[] }) {
  if (!flags?.length) return null
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
      {flags.join(" · ")}
    </div>
  )
}
