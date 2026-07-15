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

  const query = useInfiniteQuery({
    queryKey: messagesKey(filters),
    queryFn: ({ pageParam }) => fetchMessagesPage(filters, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    initialData: { pages: [initialPage], pageParams: [null] },
    staleTime: 30_000,
  })

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

      <div className="min-h-0 flex-1 overflow-y-auto">
        {rows.length === 0 ? (
          <FeedEmpty />
        ) : (
          <Feed
            data={rows}
            rowError={rowError}
            onEdit={(id, body) => {
              setError(null)
              edit.mutate({ id, body })
            }}
            onDelete={(id) => {
              setError(null)
              del.mutate(id)
            }}
          />
        )}
      </div>

      {query.hasNextPage && (
        <div className="flex shrink-0 justify-center pt-1">
          <LoadMore
            hasNextPage={query.hasNextPage}
            isFetchingNextPage={query.isFetchingNextPage}
            onLoadMore={() => query.fetchNextPage()}
          />
        </div>
      )}
    </>
  )
}
