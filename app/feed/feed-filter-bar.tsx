"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { FeedFilterPanel, type FeedFilters } from "@dmb/feed"

/**
 * The Next-aware half of filtering, and deliberately the only half that knows the
 * filters live in the URL (ADR-002). It hands FeedFilterPanel the current values
 * and, when the panel reports a change, writes them back to the query string with
 * `router.replace` — which re-renders the Server Component page against the new
 * filter set, so the first paint is always already-filtered.
 *
 * This is the "external handler" seam: the panel imports no `next/*`, mirroring
 * the LoginForm/LoginRoute split, so it stays renderable in a plain jsdom test.
 */
export function FeedFilterBar({ value }: { value: FeedFilters }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function onFilterChange(patch: Partial<FeedFilters>) {
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

  return <FeedFilterPanel value={value} onFilterChange={onFilterChange} />
}
