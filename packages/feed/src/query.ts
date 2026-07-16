import "server-only"

import { z } from "zod"

import {
  FEED_PAGE_SIZE,
  TAGS,
  authorOf,
  type FeedFilters,
  type FeedPage,
  type Message,
} from "./message"
import { messagesStore } from "./store"

const DEFAULT_LIMIT = FEED_PAGE_SIZE
// The whole store fits in one page, so `LOAD ALL` (the virtualization demo) can
// pull every remaining row in a single request instead of walking 50 cursors.
const MAX_LIMIT = 1000

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

// Either an absolute instant (what the picker sends) or a bare `YYYY-MM-DD`,
// which stays valid so older shared links keep working.
const rangeBound = z
  .string()
  .refine(
    (v) => DATE_ONLY.test(v) || !Number.isNaN(Date.parse(v)),
    "Expected YYYY-MM-DD or an ISO instant"
  )
  .optional()

// Field names match the URL, so nothing is renamed between the query string
// and the filter contract.
export const feedQuerySchema = z.object({
  user: z.array(z.string()).optional(),
  tag: z.array(z.enum(TAGS)).optional(),
  from: rangeBound,
  to: rangeBound,
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).optional(),
})
export type FeedQuery = z.infer<typeof feedQuerySchema>

/**
 * Resolve a bound to the canonical instant it means, so `matches` is a plain
 * string compare (ISO strings sort chronologically). Done here rather than as a
 * schema transform because `page.tsx` calls `getMessages` directly, bypassing
 * the schema — the two entry points must agree. A bare date expands to the
 * edges of its UTC day.
 */
function boundInstant(
  value: string | undefined,
  edge: "start" | "end"
): string | undefined {
  if (!value) return undefined
  if (DATE_ONLY.test(value)) {
    return `${value}T${edge === "start" ? "00:00:00.000" : "23:59:59.999"}Z`
  }
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? undefined : new Date(parsed).toISOString()
}

function matches(m: Message, f: FeedFilters): boolean {
  if (f.user?.length && !f.user.includes(m.createdBy)) return false
  if (f.tag?.length && !f.tag.includes(m.tag)) return false
  // Inclusive at both ends; bounds are pre-resolved to canonical instants.
  if (f.from && m.createdAt < f.from) return false
  if (f.to && m.createdAt > f.to) return false
  return true
}

// The cursor is opaque to the client: the last row's (createdAt, id), which is
// stable when a new post is inserted at the top mid-scroll.
const encodeCursor = (m: Message) => btoa(`${m.createdAt}|${m.id}`)
function decodeCursor(cursor: string): { createdAt: string; id: string } {
  const [createdAt, id] = atob(cursor).split("|")
  return { createdAt, id }
}

// Cursor, not offset, pagination: an offset would double-serve or skip rows
// once the composer inserts at the top mid-list.
export function getMessages(query: FeedQuery = {}): FeedPage {
  const { cursor, limit = DEFAULT_LIMIT, ...filters } = query
  // Resolve the range bounds once, not per row.
  const bounds: FeedFilters = {
    ...filters,
    from: boundInstant(filters.from, "start"),
    to: boundInstant(filters.to, "end"),
  }
  const filtered = messagesStore.filter((m) => matches(m, bounds))

  let start = 0
  if (cursor) {
    const { createdAt, id } = decodeCursor(cursor)
    // Store is sorted newest-first; find the first row strictly past the cursor.
    const after = filtered.findIndex(
      (m) => m.createdAt < createdAt || (m.createdAt === createdAt && m.id < id)
    )
    start = after === -1 ? filtered.length : after
  }

  const page = filtered.slice(start, start + limit)
  const hasMore = start + limit < filtered.length
  const last = page.at(-1)

  return {
    items: page.map((m) => ({ ...m, author: authorOf(m.createdBy)! })),
    nextCursor: hasMore && last ? encodeCursor(last) : null,
    // The full match count, so the client can render loaded/total pages.
    total: filtered.length,
  }
}
