"use client"

import * as React from "react"

import { FeedClient } from "../feed-client"
import { type FeedFilters, type FeedUser, type Tag } from "../message"
import { type OwnedFeedPage } from "../rbac"
import { FeedFilterMobile } from "./feed-filter-mobile"

/**
 * Holds the mobile filter's persistent UI one level *above* `FeedClient`, which
 * is deliberately remounted per filter set (its `key`) to reset the query cache
 * and optimistic state. The filter renders inside that keyed subtree, so any
 * state it owned itself — the tag row, the cog's open state, the optimistic
 * selection — would reset on every pick; held here, it survives.
 *
 * `mobileTags` seeds from the URL's active tag, so a shared `?tag=` link opens
 * with its chip already in the bar. `selectedTag` is the optimistic mirror that
 * lights the chip on tap, ~1.2s before the URL commit reaches `filters`.
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
  const [mobileTags, setMobileTags] = React.useState<Tag[]>(filters.tag ?? [])
  const [filtersOpen, setFiltersOpen] = React.useState(false)

  const committedTag = filters.tag?.[0] ?? null
  const [selectedTag, setSelectedTag] = React.useState<Tag | null>(committedTag)
  // Re-sync when the URL commits for reasons other than our own tap (a shared
  // link, Back); a no-op once our optimistic pick lands in `filters`.
  React.useEffect(() => {
    setSelectedTag(committedTag)
  }, [committedTag])

  return (
    <FeedClient
      key={JSON.stringify(filters)}
      initialPage={initialPage}
      filters={filters}
      currentUser={currentUser}
      mobileFilter={
        <FeedFilterMobile
          value={filters}
          mobileTags={mobileTags}
          onMobileTagsChange={setMobileTags}
          selected={selectedTag}
          onSelectedChange={setSelectedTag}
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
        />
      }
    />
  )
}
