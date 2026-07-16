/**
 * The feed's domain vocabulary. Client-safe on purpose: no faker, no store, no
 * `next/*` — the store that produces messages lives behind `@dmb/feed/server`.
 */

export const TAGS = ["PRODUCT", "DESIGN", "RANDOM", "ANNOUNCE"] as const
export type Tag = (typeof TAGS)[number]

// Single source for the server default and the SSR first page, so the client
// always walks the list in equal steps.
export const FEED_PAGE_SIZE = 20

export type FeedUser = {
  id: string // "u_adam" — u_${email localpart}
  handle: string // "adam"
  name: string // "Adam"
  email: string // "adam@dispatch.dev"
}

// Ids follow `u_${localpart}` — the same convention the session endpoint mints,
// so `message.createdBy` and the logged-in user's id compare directly.
export const USERS: FeedUser[] = ["adam", "eva", "snake"].map((localpart) => {
  const email = `${localpart}@dispatch.dev`
  const [name] = email.split("@")
  return {
    id: `u_${name}`,
    handle: name,
    name: name[0].toUpperCase() + name.slice(1),
    email,
  }
})

const USERS_BY_ID = new Map(USERS.map((u) => [u.id, u]))

export const authorOf = (createdBy: string): FeedUser | undefined =>
  USERS_BY_ID.get(createdBy)

/**
 * The one place a `FeedUser` is minted from a session identity — the feed page,
 * the write routes, and the optimistic client must agree on the derivation. Also
 * lets a signed-in account that isn't one of the seeded three author posts.
 */
export function userFromIdentity({ id, email }: { id: string; email: string }): FeedUser {
  const seeded = USERS_BY_ID.get(id)
  if (seeded) return seeded
  const [handle] = email.split("@")
  return { id, handle, name: handle[0].toUpperCase() + handle.slice(1), email }
}

export type Message = {
  id: string
  body: string
  tag: Tag
  createdBy: string // FeedUser["id"]
  createdAt: string // ISO 8601
}

export type FeedMessage = Message & { author: FeedUser }

export type MessageDraft = { body: string; tag: Tag }

// `total` is the filter's full match count (the same on every page), so the
// client can show a loaded/total page count.
export type FeedPage = {
  items: FeedMessage[]
  nextCursor: string | null
  total: number
}

// `from`/`to` are absolute instants (the picker converts local wall-clock to
// UTC); a bare `YYYY-MM-DD` still means the whole UTC day, so older shared
// links keep working.
export type FeedFilters = {
  user?: string[] // FeedUser["id"][]
  tag?: Tag[]
  from?: string // ISO instant (or YYYY-MM-DD), inclusive
  to?: string // ISO instant (or YYYY-MM-DD), inclusive
}
