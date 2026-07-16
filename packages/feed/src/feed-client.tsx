"use client"

import * as React from "react"
import { useInfiniteQuery } from "@tanstack/react-query"

import { Composer } from "./composer"
import { Feed } from "./feed"
import { FeedEmpty } from "./feed-empty"
import { useDeleteMessage, useEditMessage, usePostMessage } from "./feed-mutations"
import { fetchMessagesPage, messagesKey } from "./feed-query"
import { LoadMore } from "./load-more"
import {
  FEED_PAGE_SIZE,
  type FeedFilters,
  type FeedUser,
  type MessageDraft,
} from "./message"
import { type FeedRow, type OwnedFeedPage } from "./rbac"

export function FeedClient({
  initialPage,
  filters,
  currentUser,
  mobileFilter,
}: {
  initialPage: OwnedFeedPage
  filters: FeedFilters
  currentUser: FeedUser
  /** The mobile cog filter, passed in as an element so the package stays free
   * of `next/*`. */
  mobileFilter?: React.ReactNode
}) {
  // Errors render under what caused them (the composer, or that row) rather
  // than in one banner.
  const [error, setError] = React.useState<
    { message: string; target: "compose" | { id: string } } | null
  >(null)
  // A rejected post hands its draft back so the composer refills instead of
  // losing the text.
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

  // The virtualizer's scroll region. A callback ref, not a ref object: a
  // parent's ref attaches after the child's layout effects, too late for the
  // virtualizer's first measure.
  const [scrollEl, setScrollEl] = React.useState<HTMLDivElement | null>(null)

  // Per-fetch page size; LOAD ALL bumps it for one request. A ref so changing
  // it doesn't re-run the query.
  const pageSizeRef = React.useRef<number | null>(null)

  const query = useInfiniteQuery({
    queryKey: messagesKey(filters),
    queryFn: ({ pageParam }) =>
      fetchMessagesPage(filters, pageParam, pageSizeRef.current ?? undefined),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    initialData: { pages: [initialPage], pageParams: [null] },
    staleTime: 30_000,
    // A focus refetch would re-slice loaded pages at the default limit and drop
    // LOAD ALL's rows and any optimistic state.
    refetchOnWindowFocus: false,
  })

  // LOAD ALL exists so the virtualization is demonstrable without 50 LOAD MORE
  // clicks: one large-page request fills the feed.
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

  // Loaded pages derives from the row count, not `data.pages.length` — LOAD ALL
  // pulls everything in one large page, which would read "2/51". Clamped because
  // an optimistic insert can briefly exceed the server's total.
  const total = query.data?.pages.at(-1)?.total ?? initialPage.total
  const totalPages = Math.ceil(total / FEED_PAGE_SIZE)
  const loadedPages = Math.min(
    Math.ceil(rows.length / FEED_PAGE_SIZE),
    totalPages
  )

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

      {totalPages > 0 && (
        <p className="shrink-0 pt-1 text-right font-mono text-[13px] text-muted-foreground">
          {loadedPages}/{totalPages} pages
        </p>
      )}

      {/* Kept mounted even when fully loaded: the disabled end-state tells the
          user they've reached the end, instead of the control vanishing. */}
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
