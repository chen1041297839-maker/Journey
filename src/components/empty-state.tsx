import { cn } from "@/lib/utils"

export function EmptyState({
  title,
  description,
  className,
}: {
  title: string
  description: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/60 px-6 py-16 text-center",
        className
      )}
    >
      <p className="cjk-flow font-heading text-lg text-foreground">{title}</p>
      <p className="cjk-flow mt-2 max-w-lg text-sm leading-7 text-muted-foreground">{description}</p>
    </div>
  )
}

export function SectionEmpty({
  title,
  hint,
}: {
  title: string
  hint: string
}) {
  return (
    <div className="w-full min-w-0 rounded-xl border border-dashed border-border bg-muted/40 px-5 py-8 text-center">
      <p className="cjk-flow text-sm font-medium leading-7 text-foreground">{title}</p>
      <p className="cjk-flow mt-2 text-sm leading-7 text-muted-foreground">{hint}</p>
    </div>
  )
}
