"use client"

import * as React from "react"

import {
  FeedClient,
  type FeedFilters,
  type FeedUser,
  type OwnedFeedPage,
  type Tag,
} from "@dmb/feed"

import { FeedFilterMobile, initRecency } from "./feed-filter-mobile"

/**
 * Holds the mobile filter's persistent UI — the recency window and the cog's
 * open state — one level *above* `FeedClient`.
 *
 * `FeedClient` is remounted per filter set (its `key`) so a filter change resets
 * the query cache and optimistic state. The mobile filter lives inside it (pinned
 * under the composer), so its own state would reset on every pick too — the tag
 * chips would reshuffle and the panel would snap shut. Keeping that state here,
 * where nothing is keyed, lets it survive across selections; the filter is handed
 * it as controlled props.
 */
export function FeedSection({
  initialPage,
  filters,
  currentUser,
}: {
  initialPage: OwnedFeedPage
  filters: FeedFilters
  currentUser: FeedUser
}) {
  const [recency, setRecency] = React.useState<Tag[]>(() =>
    initRecency(filters.tag?.[0] ?? null)
  )
  const [filtersOpen, setFiltersOpen] = React.useState(false)

  return (
    <FeedClient
      key={JSON.stringify(filters)}
      initialPage={initialPage}
      filters={filters}
      currentUser={currentUser}
      mobileFilter={
        <FeedFilterMobile
          value={filters}
          recency={recency}
          onRecencyChange={setRecency}
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
        />
      }
    />
  )
}
