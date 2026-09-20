import type { ShotComposition } from "@/data/types"
import { cn } from "@/lib/utils"

const FALLBACK_PALETTE: [string, string, string] = ["#6B4B3E", "#E4D5C0", "#1F1A16"]

export function ShotFrame({
  composition,
  className,
}: {
  composition?: ShotComposition | null
  className?: string
}) {
  const palette = composition?.palette
  const a = palette?.[0] || FALLBACK_PALETTE[0]
  const b = palette?.[1] || FALLBACK_PALETTE[1]
  const c = palette?.[2] || FALLBACK_PALETTE[2]
  const sky = composition?.sky || "上 20%"
  const subject = composition?.subject || "主体居中偏上"
  const foreground = composition?.foreground || "地面或前景"
  return (
    <div
      className={cn(
        "relative aspect-[4/5] overflow-hidden rounded-lg ring-1 ring-foreground/10",
        className
      )}
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${a} 0%, ${b} 52%, ${c} 100%)`,
        }}
      />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22%3E%3Ccircle cx=%222%22 cy=%222%22 r=%220.6%22 fill=%22white%22 fill-opacity=%220.18%22/%3E%3C/svg%3E')] opacity-70" />
      <div className="absolute inset-x-0 top-0 h-[28%] border-b border-white/20 bg-white/10">
        <span className="absolute top-2 left-2 text-[10px] tracking-widest text-white/80">
          SKY · {sky}
        </span>
      </div>
      <div className="absolute inset-x-[18%] top-[22%] bottom-[32%] border border-white/35">
        <span className="absolute top-1/2 left-1/2 w-[80%] -translate-x-1/2 -translate-y-1/2 text-center text-[10px] leading-snug text-white/90">
          {subject}
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[30%] bg-black/25">
        <span className="absolute bottom-2 left-2 right-2 text-[10px] text-white/80">
          FG · {foreground}
        </span>
      </div>
    </div>
  )
}
