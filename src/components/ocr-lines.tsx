import type { OcrLine } from "@/data/types"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function OcrLines({
  lines,
  className,
}: {
  lines?: OcrLine[]
  className?: string
}) {
  if (!lines?.length) return null
  return (
    <ul className={cn("mt-2 grid gap-1.5", className)}>
      {lines.map((line, index) => (
        <li
          key={`${line.text}-${index}`}
          className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs leading-relaxed text-muted-foreground"
        >
          <span>{line.text}</span>
          {line.uncertain ? (
            <Badge variant="outline" className="font-normal">
              识别不确定
            </Badge>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
