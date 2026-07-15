"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"

import { type Tag } from "../message"
import { FeedFilterPanel } from "./feed-filters"
import { parseFilterParams, useFilterQuery } from "./use-filter-query"

/**
 * The desktop `FILTERS` rail (hidden below `lg`; the mobile layout uses the cog
 * panel under the composer instead).
 *
 * The tag selection is held optimistically. The URL is the source of truth, but a
 * navigation only commits after the mock latency (~1.2s, ADR-005), and the rail
 * isn't replaced by the loading skeleton during that window — so if it toggled
 * against the URL/prop, a quick second pick would read stale state and drop the
 * first (multi-select would behave like single-select). Instead it mirrors the
 * tags into local state, updates them on the same click that writes the URL, and
 * re-syncs from the URL when it changes for other reasons (a shared link, Back).
 */
export function FeedFilterBar() {
  const searchParams = useSearchParams()
  const onFilterChange = useFilterQuery()
  const urlFilters = parseFilterParams(searchParams)

  const urlTags = urlFilters.tag ?? []
  const [tags, setTags] = React.useState<Tag[]>(urlTags)

  // Reconcile with the committed URL (external navigations); keyed on the joined
  // value so it's a no-op once our own optimistic update lands in the URL.
  const urlTagKey = urlTags.join(",")
  React.useEffect(() => {
    setTags(urlTagKey ? (urlTagKey.split(",") as Tag[]) : [])
  }, [urlTagKey])

  return (
    <FeedFilterPanel
      value={{ ...urlFilters, tag: tags.length > 0 ? tags : undefined }}
      onFilterChange={(patch) => {
        if ("tag" in patch) setTags(patch.tag ?? [])
        onFilterChange(patch)
      }}
    />
  )
}
