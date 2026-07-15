import { type FeedFilters } from "./message"
import { type OwnedFeedPage } from "./rbac"

/**
 * The client half of the feed's read contract — the query key, the URL builder,
 * and the page fetch — kept in one client-safe module so the list query
 * (`feed-client`) and the optimistic mutations (`feed-mutations`) target the
 * *same* cache entry. The key includes the active filters, so a filter change is a
 * different query and stale pages can't linger (ADR-006).
 */
export const messagesKey = (filters: FeedFilters) => ["messages", filters] as const

/** Serialize filters (+ optional cursor and limit) to the repeated-param URL the route parses. */
export function buildMessagesQuery(
  filters: FeedFilters,
  cursor?: string | null,
  limit?: number
): URLSearchParams {
  const params = new URLSearchParams()
  filters.user?.forEach((user) => params.append("user", user))
  filters.tag?.forEach((tag) => params.append("tag", tag))
  if (filters.from) params.set("from", filters.from)
  if (filters.to) params.set("to", filters.to)
  if (cursor) params.set("cursor", cursor)
  if (limit) params.set("limit", String(limit))
  return params
}

/**
 * Fetch one page; throws on a non-2xx so React Query routes it to `isError`.
 * `limit` is normally left to the server default (20); `LOAD ALL` passes a large
 * one so the virtualization demo pulls every remaining row in a single request.
 */
export async function fetchMessagesPage(
  filters: FeedFilters,
  cursor: string | null,
  limit?: number
): Promise<OwnedFeedPage> {
  const res = await fetch(`/api/messages?${buildMessagesQuery(filters, cursor, limit)}`)
  if (!res.ok) throw new Error(`Failed to load messages (${res.status})`)
  return res.json() as Promise<OwnedFeedPage>
}
