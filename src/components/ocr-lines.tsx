import type { OcrLine } from "@/data/types"
import { Badge } from "@/components/ui/badge"
import { cleanCjkText } from "@/lib/cjk-text"
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
          className="text-pretty text-xs leading-relaxed break-normal text-muted-foreground"
        >
          {cleanCjkText(line.text)}
          {line.uncertain ? (
            <Badge variant="outline" className="ml-2 align-middle font-normal">
              识别不确定
            </Badge>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
