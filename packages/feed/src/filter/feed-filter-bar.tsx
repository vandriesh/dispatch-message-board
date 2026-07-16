"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"

import { type Tag } from "../message"
import { FeedFilterPanel } from "./feed-filters"
import { parseFilterParams, useFilterQuery } from "./use-filter-query"

/**
 * The desktop `FILTERS` rail. The tag selection is mirrored into local state
 * optimistically: the URL is the source of truth but only commits after the
 * ~1.2s latency, so chips reading straight off the URL would let a quick re-tap
 * toggle against stale state. Local state updates on click and re-syncs when
 * the URL changes for other reasons (a shared link, Back).
 */
export function FeedFilterBar() {
  const searchParams = useSearchParams()
  const { onFilterChange, isPending } = useFilterQuery()
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
      pending={isPending ? (tags[0] ?? null) : null}
      onFilterChange={(patch) => {
        if ("tag" in patch) setTags(patch.tag ?? [])
        onFilterChange(patch)
      }}
    />
  )
}
