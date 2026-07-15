"use client"

import { Button } from "@dmb/ui-kit"

/**
 * The `LOAD MORE` button (F10, ADR-004) — now a thin control over the shared
 * `useInfiniteQuery` in `FeedClient`. The pages it used to accumulate in local
 * state are the query's `data.pages`; this only reflects `hasNextPage` and drives
 * `fetchNextPage`. The loading label is real because the store lags (mockLatency).
 *
 * Still the focusable, announceable baseline the ADR describes; auto-fetch-on-scroll
 * and virtualization (ADR-006) layer on top later without changing this.
 */
export function LoadMore({
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: {
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onLoadMore: () => void
}) {
  if (!hasNextPage) return null

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      onClick={onLoadMore}
      disabled={isFetchingNextPage}
      className="self-center"
    >
      {isFetchingNextPage ? "LOADING…" : "LOAD MORE ↓"}
    </Button>
  )
}
