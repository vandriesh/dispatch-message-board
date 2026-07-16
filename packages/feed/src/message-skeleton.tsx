import { Skeleton } from "@dmb/ui-kit"

// One resting card's shape, mirroring simple-card.tsx. Shared by the feed's
// loading state and /ui-kit, which shows the real component, not a replica.
export function MessageSkeleton() {
  return (
    <div className="border-[3px] border-ink bg-surface p-[18px]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-[10px]">
          <Skeleton className="size-[38px]" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-[140px]" />
            <Skeleton className="h-2.5 w-[90px]" />
          </div>
        </div>
        <Skeleton className="h-3 w-7" />
      </div>

      <div className="mt-[14px] flex flex-col gap-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>

      <div className="mt-4">
        <Skeleton className="h-[27px] w-[84px]" />
      </div>
    </div>
  )
}
