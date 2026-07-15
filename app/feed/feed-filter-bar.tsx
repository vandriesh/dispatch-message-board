"use client"

import { FeedFilterPanel, type FeedFilters } from "@dmb/feed"

import { useFilterQuery } from "./use-filter-query"

/**
 * The desktop `FILTERS` rail. Wires the presentational `FeedFilterPanel` to the
 * URL via `useFilterQuery`; the panel imports no `next/*`, mirroring the
 * LoginForm/LoginRoute split so it stays renderable in a plain jsdom test.
 *
 * Hidden below `lg` — the mobile layout uses the cog panel under the composer
 * (app/feed/feed-filter-mobile.tsx) instead.
 */
export function FeedFilterBar({ value }: { value: FeedFilters }) {
  const onFilterChange = useFilterQuery()
  return <FeedFilterPanel value={value} onFilterChange={onFilterChange} />
}
