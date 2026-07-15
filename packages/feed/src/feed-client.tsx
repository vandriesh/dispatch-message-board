"use client"

import * as React from "react"
import { useInfiniteQuery } from "@tanstack/react-query"

import { Composer } from "./composer"
import { Feed } from "./feed"
import { FeedEmpty } from "./feed-empty"
import { useDeleteMessage, useEditMessage, usePostMessage } from "./feed-mutations"
import { fetchMessagesPage, messagesKey } from "./feed-query"
import { LoadMore } from "./load-more"
import { type FeedFilters, type FeedUser, type MessageDraft } from "./message"
import { type FeedRow, type OwnedFeedPage } from "./rbac"

/**
 * The feed's client container — the one place the whole right column's data lives.
 * It replaces the old split where page 1 was a Server Component and pages 2..n sat
 * in `LoadMore`'s own state: post/edit/delete and the optimistic overlay need a
 * *single* list, so it owns the `useInfiniteQuery` and passes mutation handlers to
 * the composer and each row.
 *
 * The server-rendered first page is handed in as `initialData` and hydrated into
 * the cache rather than refetched (Q1: "hydrated, not fetched twice"). Its rows
 * are already `owner`-stamped at the server boundary (rbac) so each card can
 * branch on ownership without the client re-deriving it. The query key carries the
 * active filters, so a filter change is a new query (and the page remounts this per
 * filter set anyway, ADR-004).
 */
export function FeedClient({
  initialPage,
  filters,
  currentUser,
  mobileFilter,
}: {
  initialPage: OwnedFeedPage
  filters: FeedFilters
  currentUser: FeedUser
  /** The mobile cog filter (app-supplied, URL-aware), pinned under the composer
   * below `lg`. Passed in as an element so the package stays free of `next/*`. */
  mobileFilter?: React.ReactNode
}) {
  // A single active error, tagged with where it belongs — the composer (a failed
  // post, whose optimistic row has already rolled back) or a specific row (a failed
  // edit/delete, which the rollback just restored). It renders under that element
  // rather than in one banner, so the message sits with the thing that caused it.
  const [error, setError] = React.useState<
    { message: string; target: "compose" | { id: string } } | null
  >(null)
  // A rejected post hands its draft back so the composer can refill rather than
  // lose the text. Identity changes per failure, which is how the composer knows
  // to re-apply it.
  const [rejectedDraft, setRejectedDraft] = React.useState<MessageDraft | null>(null)
  const onComposeError = React.useCallback(
    (message: string, draft: MessageDraft) => {
      setError({ message, target: "compose" })
      setRejectedDraft(draft)
    },
    []
  )
  const onRowError = React.useCallback(
    (message: string, id: string) => setError({ message, target: { id } }),
    []
  )
  const rowError =
    error && typeof error.target === "object"
      ? { id: error.target.id, message: error.message }
      : null
  const composeError = error?.target === "compose" ? error.message : null

  // The scroll region the virtualizer measures. Owned here (the app shell), not by
  // `Feed` — the list renders into this product-owned scroller rather than adding
  // its own (B2, ADR-004). Held in state via a callback ref, not a ref object: the
  // scroller is `Feed`'s parent, and a parent's ref attaches only after the child's
  // layout effects run, so a ref object would be null when the virtualizer first
  // measures. Setting state re-renders once the node exists so `Feed` receives it.
  const [scrollEl, setScrollEl] = React.useState<HTMLDivElement | null>(null)

  // Per-fetch page size, read by the query fn. Normally null → the server default
  // (20) for LOAD MORE and auto-fetch; LOAD ALL bumps it to pull every remaining
  // row in one request, then resets it. A ref (not state) so changing it doesn't
  // re-run the query — only the next fetch reads it.
  const pageSizeRef = React.useRef<number | null>(null)

  const query = useInfiniteQuery({
    queryKey: messagesKey(filters),
    queryFn: ({ pageParam }) =>
      fetchMessagesPage(filters, pageParam, pageSizeRef.current ?? undefined),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    initialData: { pages: [initialPage], pageParams: [null] },
    staleTime: 30_000,
    // The cache is authoritative and mutated in place (ADR-005); a focus refetch
    // would re-slice loaded pages with the default limit and drop LOAD ALL's rows
    // (and any optimistic state), so don't.
    refetchOnWindowFocus: false,
  })

  // LOAD ALL — fill the list so the virtualization is demonstrable without 50
  // LOAD MORE clicks. With the large page size this is one request; the loop only
  // iterates if a small auto-fetch page was deduped in first.
  const [isLoadingAll, setIsLoadingAll] = React.useState(false)
  const onLoadAll = React.useCallback(async () => {
    setIsLoadingAll(true)
    pageSizeRef.current = 1000 // ≥ the store size: grabs all remaining in one page
    try {
      let more = query.hasNextPage
      while (more) {
        const res = await query.fetchNextPage()
        more = res.hasNextPage
      }
    } finally {
      pageSizeRef.current = null
      setIsLoadingAll(false)
    }
  }, [query])

  const post = usePostMessage({ filters, currentUser, onError: onComposeError })
  const edit = useEditMessage({ filters, onError: onRowError })
  const del = useDeleteMessage({ filters, onError: onRowError })

  const rows = (query.data?.pages.flatMap((page) => page.items) ?? []) as FeedRow[]

  // App shell: the composer and the mobile filter stay pinned at the top, the
  // messages scroll in the space that's left, and LOAD MORE is parked at the
  // bottom. The parent `<section>` is a bounded-height flex column, so these are
  // its direct flex children (the fragment adds no box).
  return (
    <>
      <div className="shrink-0">
        <Composer
          error={composeError}
          restore={rejectedDraft}
          onPost={(draft) => {
            setError(null)
            setRejectedDraft(null)
            post.mutate(draft)
          }}
        />
      </div>

      {mobileFilter}

      <div ref={setScrollEl} className="min-h-0 flex-1 overflow-y-auto">
        {rows.length === 0 ? (
          <FeedEmpty />
        ) : (
          <Feed
            data={rows}
            scrollElement={scrollEl}
            rowError={rowError}
            onEdit={(id, body) => {
              setError(null)
              edit.mutate({ id, body })
            }}
            onDelete={(id) => {
              setError(null)
              del.mutate(id)
            }}
            hasNextPage={query.hasNextPage}
            isFetchingNextPage={query.isFetchingNextPage}
            onNeedMore={() => query.fetchNextPage()}
          />
        )}
      </div>

      {/* Kept mounted whenever the feed has rows — even fully loaded — so the
          disabled end-state tells the user they've reached the end (rather than
          the control silently vanishing). */}
      {rows.length > 0 && (
        <div className="flex shrink-0 justify-center pt-1">
          <LoadMore
            hasNextPage={query.hasNextPage}
            isFetchingNextPage={query.isFetchingNextPage}
            isLoadingAll={isLoadingAll}
            onLoadMore={() => query.fetchNextPage()}
            onLoadAll={onLoadAll}
          />
        </div>
      )}
    </>
  )
}
