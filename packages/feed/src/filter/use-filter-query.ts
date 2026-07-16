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
 * Parse URL params into `FeedFilters`. The filter surfaces read the *live* URL
 * through this rather than the server-rendered prop, which lags by the mock
 * latency — a quick second click would otherwise toggle against stale state.
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
 * Writes a filter patch to the query string — the one place that knows the
 * filters live in the URL, shared by the desktop rail and the mobile cog panel.
 * It reads `window.location.search` at call time (not a render snapshot) so a
 * change merges correctly even while an earlier navigation is still settling;
 * the transition's `isPending` drives the pending spinner on the tapped chip.
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
