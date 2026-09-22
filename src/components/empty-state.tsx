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
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/60 px-6 py-16 text-center",
        className
      )}
    >
      <p className="font-heading text-lg text-foreground">{title}</p>
      <p className="mt-2 max-w-sm text-pretty text-sm leading-relaxed break-normal text-muted-foreground">
        {description}
      </p>
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
    <div className="rounded-xl border border-dashed border-border bg-muted/40 px-4 py-8 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
    </div>
  )
}
