"use client"

import { Button } from "@dmb/ui-kit"

/**
 * The `LOAD MORE` / `LOAD ALL` controls (F10, ADR-004) — thin buttons over the
 * shared `useInfiniteQuery` in `FeedClient`. The pages they advance are the
 * query's `data.pages`; this only reflects `hasNextPage` and drives the fetches.
 *
 * `LOAD MORE` walks the cursor one page at a time — the focusable, announceable
 * baseline the ADR describes, and the recovery path when auto-fetch-on-scroll (in
 * `Feed`) has nothing to trigger it. `LOAD ALL` pulls every remaining row in one
 * request: it's the fast way to fill the list to 1000+ so the virtualization (B2)
 * is actually demonstrable without 50 clicks. Loading labels are real because the
 * store lags (mockLatency).
 *
 * When there's nothing left to fetch the buttons **stay rendered but disabled** —
 * a bottom control that simply vanishes reads as "did it break?", whereas a
 * disabled end-state tells the user they've reached the end. `FeedClient` keeps
 * this mounted whenever the feed has rows.
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
