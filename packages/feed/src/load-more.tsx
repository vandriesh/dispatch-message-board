"use client"

import { Button } from "@dmb/ui-kit"

/**
 * `LOAD MORE` walks the cursor one page at a time — the focusable, announceable
 * baseline under the auto-fetch-on-scroll. `LOAD ALL` pulls every remaining row
 * in one request: the fast way to fill the list to 1000+ so the virtualization
 * is demonstrable without 50 clicks.
 *
 * When there's nothing left the buttons stay rendered but disabled — a control
 * that vanishes reads as "did it break?"; a disabled end-state says "you've
 * reached the end".
 */
export function LoadMore({
  hasNextPage,
  isFetchingNextPage,
  isLoadingAll,
  onLoadMore,
  onLoadAll,
}: {
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isLoadingAll: boolean
  onLoadMore: () => void
  onLoadAll: () => void
}) {
  const busy = isFetchingNextPage || isLoadingAll
  const done = !hasNextPage

  return (
    <div className="flex items-center justify-center gap-3">
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={onLoadMore}
        disabled={busy || done}
      >
        {isFetchingNextPage && !isLoadingAll ? "LOADING…" : "LOAD MORE ↓"}
      </Button>
      <Button
        type="button"
        variant="default"
        size="lg"
        onClick={onLoadAll}
        disabled={busy || done}
      >
        {isLoadingAll ? "LOADING ALL…" : "LOAD ALL ⇊"}
      </Button>
    </div>
  )
}
