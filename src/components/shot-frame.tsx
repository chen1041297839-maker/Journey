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
        "relative aspect-[16/7] w-full min-w-0 overflow-hidden rounded-lg ring-1 ring-foreground/10",
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
        <span className="absolute top-2 left-3 right-3 text-[11px] leading-5 text-white/90">
          天空 · {sky}
        </span>
      </div>
      <div className="absolute inset-x-[12%] top-[24%] bottom-[30%] border border-white/35">
        <span className="absolute top-1/2 left-1/2 w-[90%] -translate-x-1/2 -translate-y-1/2 text-center text-[12px] leading-6 text-white/90">
          {subject}
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[28%] bg-black/25">
        <span className="absolute right-3 bottom-2 left-3 text-[11px] leading-5 text-white/85">
          前景 · {foreground}
        </span>
      </div>
    </div>
  )
}
