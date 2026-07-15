"use client"

import * as React from "react"

import { FeedClient } from "../feed-client"
import { type FeedFilters, type FeedUser, type Tag } from "../message"
import { type OwnedFeedPage } from "../rbac"
import { FeedFilterMobile } from "./feed-filter-mobile"

/**
 * Holds the mobile filter's persistent UI — the `mobileTags` list and the cog's
 * open state — one level *above* `FeedClient`.
 *
 * `FeedClient` is remounted per filter set (its `key`) so a filter change resets
 * the query cache and optimistic state. The mobile filter lives inside it (pinned
 * under the composer), so its own state would reset on every pick too — the tag
 * chips would reshuffle and the panel would snap shut. Keeping that state here,
 * where nothing is keyed, lets it survive across selections; the filter is handed
 * it as controlled props.
 *
 * `mobileTags` starts empty — the bar shows only the cog until a tag is picked
 * from the panel, at which point it's pushed to the front and the first three
 * show (see FeedFilterMobile).
 *
 * The active tag is held here too, optimistically. `FeedFilterMobile` lives inside
 * the keyed `FeedClient`, so it can't hold its own optimistic selection across the
 * remount; and the server `filters` prop only reflects the pick after the mock
 * latency (~1.2s, ADR-005) commits — too late for the chip to light up on tap. So
 * the selection is mirrored here (surviving the remount) and reconciled with the
 * committed URL, mirroring the desktop rail's approach (feed-filter-bar.tsx).
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
  const [mobileTags, setMobileTags] = React.useState<Tag[]>([])
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
