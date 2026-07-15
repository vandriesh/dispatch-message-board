"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"

import { TAGS, type FeedFilters, type Tag } from "../message"

const TAG_SET = new Set<string>(TAGS)

/** A read view over URL search params — satisfied by both `URLSearchParams` and
 * Next's `ReadonlyURLSearchParams`. */
type ReadableParams = {
  get(name: string): string | null
  getAll(name: string): string[]
}

/**
 * Parse URL params into the `FeedFilters` contract (ADR-002) — the client-side
 * twin of the server parse in `page.tsx`. The desktop rail reads the *live* URL
 * through this rather than the server-rendered prop, which lags behind by the
 * mock latency (ADR-005) while a navigation is pending — long enough that a quick
 * second tag click would otherwise toggle against stale state and drop the first.
 */
export function parseFilterParams(params: ReadableParams): FeedFilters {
  const tag = params.getAll("tag").filter((t): t is Tag => TAG_SET.has(t))
  const user = params.getAll("user")
  return {
    user: user.length > 0 ? user : undefined,
    tag: tag.length > 0 ? tag : undefined,
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
  }
}

/**
 * The Next-aware half of filtering, and deliberately the only half that knows the
 * filters live in the URL (ADR-002). It returns the `onFilterChange` handler that
 * writes a filter patch back to the query string with `router.replace` — which
 * re-renders the Server Component page against the new filter set, so the first
 * paint is always already-filtered.
 *
 * The handler reads the *current* URL (`window.location.search`) at call time,
 * not a render snapshot, so a change merges against whatever filters are actually
 * in the URL even while an earlier navigation is still settling.
 *
 * Extracted into a hook so both filter surfaces — the desktop rail and the mobile
 * cog panel — drive the same URL, rather than each re-deriving it.
 *
 * The `router.replace` runs inside a `startTransition`, so `isPending` stays true
 * for the whole navigation — including the mock latency (~1.2s, ADR-005) the RSC
 * page render waits out. The filter surfaces use it to show a pending indicator on
 * the just-picked chip while the feed reloads.
 */
export function useFilterQuery(): {
  onFilterChange: (patch: Partial<FeedFilters>) => void
  isPending: boolean
} {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = React.useTransition()

  const onFilterChange = React.useCallback(
    (patch: Partial<FeedFilters>) => {
      const params = new URLSearchParams(window.location.search)

      for (const [field, next] of Object.entries(patch)) {
        params.delete(field)
        if (Array.isArray(next)) {
          for (const item of next) params.append(field, item)
        } else if (next) {
          params.set(field, next)
        }
      }

      startTransition(() => {
        router.replace(pathname + (params.size ? `?${params}` : ""), {
          scroll: false,
        })
      })
    },
    [router, pathname]
  )

  return { onFilterChange, isPending }
}
