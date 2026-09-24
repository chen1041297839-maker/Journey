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
        "flex w-full min-w-0 flex-col items-start justify-center px-1 py-12 text-left",
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
    <div className="w-full min-w-0 border-t border-border px-1 py-8">
      <p className="cjk-flow text-sm font-medium leading-7 text-foreground">{title}</p>
      <p className="cjk-flow mt-2 text-sm leading-7 text-muted-foreground">{hint}</p>
    </div>
  )
}
