"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { type FeedFilters } from "@dmb/feed"

/**
 * The Next-aware half of filtering, and deliberately the only half that knows the
 * filters live in the URL (ADR-002). It returns the `onFilterChange` handler that
 * writes a filter patch back to the query string with `router.replace` — which
 * re-renders the Server Component page against the new filter set, so the first
 * paint is always already-filtered.
 *
 * Extracted into a hook so both filter surfaces — the desktop rail and the mobile
 * cog panel — drive the same URL, rather than each re-deriving it.
 */
export function useFilterQuery(): (patch: Partial<FeedFilters>) => void {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  return function onFilterChange(patch: Partial<FeedFilters>) {
    const params = new URLSearchParams(searchParams)

    for (const [field, next] of Object.entries(patch)) {
      params.delete(field)
      if (Array.isArray(next)) {
        for (const item of next) params.append(field, item)
      } else if (next) {
        params.set(field, next)
      }
    }

    router.replace(pathname + (params.size ? `?${params}` : ""), {
      scroll: false,
    })
  }
}
