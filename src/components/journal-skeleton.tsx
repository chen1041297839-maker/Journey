import { Skeleton } from "@/components/ui/skeleton"

export function JournalSkeleton() {
  return (
    <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-8 px-4 py-6 lg:flex-row lg:items-start">
      <div className="flex w-full min-w-0 flex-col gap-4 lg:w-[22rem] lg:shrink-0">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
      <div className="hidden w-full min-w-0 flex-1 flex-col gap-4 lg:flex">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    </div>
  )
}
