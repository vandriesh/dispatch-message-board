"use client"

import * as React from "react"
import { Button } from "@dmb/ui-kit"

import { Feed } from "./feed"
import { type FeedFilters, type FeedMessage, type FeedPage } from "./message"

/**
 * The `LOAD MORE` button (F10, ADR-004) and the pages it appends. The first page
 * is server-rendered by the feed container; this picks up from that page's
 * `nextCursor` and fetches pages 2..n from `GET /api/messages` on click, keeping
 * the accumulated rows in local state.
 *
 * This is the *baseline* the ADR describes — the focusable, announceable control
 * that always works. Auto-fetch-on-scroll and virtualization (TanStack Query +
 * Virtual, ADR-006) are the enhancement that layers on top later; deliberately
 * hand-rolled here rather than pulling that in for a single button.
 *
 * Remounted per filter set (the container keys it on the active filters), so a
 * filter change resets the appended rows and the cursor rather than stacking a
 * new filter's results under the old ones.
 */
export function LoadMore({
  filters,
  initialCursor,
}: {
  filters: FeedFilters
  initialCursor: string | null
}) {
  const [items, setItems] = React.useState<FeedMessage[]>([])
  const [cursor, setCursor] = React.useState(initialCursor)
  const [loading, setLoading] = React.useState(false)

  async function loadMore() {
    if (!cursor || loading) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      filters.user?.forEach((user) => params.append("user", user))
      filters.tag?.forEach((tag) => params.append("tag", tag))
      if (filters.from) params.set("from", filters.from)
      if (filters.to) params.set("to", filters.to)
      params.set("cursor", cursor)

      const res = await fetch(`/api/messages?${params}`)
      if (!res.ok) return
      const page = (await res.json()) as FeedPage

      setItems((prev) => [...prev, ...page.items])
      setCursor(page.nextCursor)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {items.length > 0 && <Feed data={items} />}
      {cursor && (
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={loadMore}
          disabled={loading}
          className="self-center"
        >
          {loading ? "LOADING…" : "LOAD MORE ↓"}
        </Button>
      )}
    </>
  )
}
