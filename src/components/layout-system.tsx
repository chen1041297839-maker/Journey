import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function Panel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <section className={cn("panel", className)}>{children}</section>
}

export function MetaLabel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <p className={cn("text-[11px] font-medium text-primary", className)}>{children}</p>
}

export function Heading({
  children,
  className,
  as: Tag = "h3",
}: {
  children: ReactNode
  className?: string
  as?: "h1" | "h2" | "h3" | "h4" | "p"
}) {
  return (
    <Tag className={cn("cjk-flow font-heading text-xl leading-snug tracking-normal", className)}>
      {children}
    </Tag>
  )
}

export function PlaceLine({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <p className={cn("cjk-flow text-sm leading-7 text-primary", className)}>{children}</p>
}

export function Copy({
  children,
  className,
  muted = false,
}: {
  children: ReactNode
  className?: string
  muted?: boolean
}) {
  return (
    <p
      className={cn(
        "cjk-flow text-sm leading-7",
        muted ? "text-muted-foreground" : "text-foreground",
        className
      )}
    >
      {children}
    </p>
  )
}

export function MediaRow({
  media,
  children,
  className,
}: {
  media?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("media-row", className)}>
      {media ? <div className="media-aside">{media}</div> : null}
      <div className="media-body">{children}</div>
    </div>
  )
}

export function Stack({
  children,
  className,
  gap = "md",
}: {
  children: ReactNode
  className?: string
  gap?: "sm" | "md" | "lg"
}) {
  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-col",
        gap === "sm" && "gap-3",
        gap === "md" && "gap-5",
        gap === "lg" && "gap-8",
        className
      )}
    >
      {children}
    </div>
  )
}
