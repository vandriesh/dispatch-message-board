import { type FeedFilters } from "./message"
import { type OwnedFeedPage } from "./rbac"

// One module for the key + fetch so the list query and the optimistic
// mutations target the same cache entry. The key includes the filters, so a
// filter change is a different query.
export const messagesKey = (filters: FeedFilters) => ["messages", filters] as const

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

// `limit` is normally the server default; `LOAD ALL` passes a large one so the
// virtualization demo pulls every remaining row in a single request.
export async function fetchMessagesPage(
  filters: FeedFilters,
  cursor: string | null,
  limit?: number
): Promise<OwnedFeedPage> {
  const res = await fetch(`/api/messages?${buildMessagesQuery(filters, cursor, limit)}`)
  if (!res.ok) throw new Error(`Failed to load messages (${res.status})`)
  return res.json() as Promise<OwnedFeedPage>
}
