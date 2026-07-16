/**
 * @dmb/feed — the domain model for the message feed.
 *
 * Client-safe on purpose: no faker, no store, no `next/*`. Everything here is the
 * shared vocabulary — the Message shape, the fixed tag set, the seeded users, and
 * the filter contract — that both the server (the store + route handler) and the
 * client (the composer + filter UI) agree on. The runtime store that *produces*
 * messages lives in `store.ts` behind `import "server-only"`, so importing this
 * module never drags faker into a client bundle. Types are defined where the data
 * is born (CLAUDE.md), which is right here.
 */

/** The fixed tag vocabulary (O2, confirmed by the design). One tag per message. */
export const TAGS = ["PRODUCT", "DESIGN", "RANDOM", "ANNOUNCE"] as const
export type Tag = (typeof TAGS)[number]

/**
 * Rows per page — the single source for both the server default (`getMessages`)
 * and the first server-rendered page (`page.tsx`), so the client, which fetches
 * without an explicit `limit`, always walks the list in steps of this size. The
 * feed's loaded/total *page* count (see FeedClient) is derived from it.
 */
export const FEED_PAGE_SIZE = 20

export type FeedUser = {
  id: string // "u_adam" — u_${email localpart}
  handle: string // "adam"
  name: string // "Adam"
  email: string // "adam@dispatch.dev"
}

/**
 * The three seeded accounts. Ids follow the project convention `id = u_${name}`
 * where `const [name] = email.split("@")` — the same convention the session
 * endpoint uses, so `message.createdBy` and the logged-in user's id line up and
 * the author-only edit/delete check (F8/F9) has something real to compare.
 */
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

/** Resolve a `createdBy` id to its author, for denormalizing into the feed. */
export const authorOf = (createdBy: string): FeedUser | undefined =>
  USERS_BY_ID.get(createdBy)

/**
 * Build a `FeedUser` from a session identity (`id` + `email`), deriving handle and
 * name the same way `USERS` does. The one place this shape is minted, shared by
 * three callers that must agree: the feed page (the logged-in author it hands to
 * the composer), the write routes (denormalizing a fresh post's author), and the
 * optimistic client (the temp row it shows before the server answers). It also
 * lets a signed-in account that isn't one of the seeded three still author posts.
 */
export function userFromIdentity({ id, email }: { id: string; email: string }): FeedUser {
  const seeded = USERS_BY_ID.get(id)
  if (seeded) return seeded
  const [handle] = email.split("@")
  return { id, handle, name: handle[0].toUpperCase() + handle.slice(1), email }
}

/** A stored message. `body` is capped at 240 chars (F2). */
export type Message = {
  id: string
  body: string
  tag: Tag
  createdBy: string // FeedUser["id"]
  createdAt: string // ISO 8601
}

/** What the feed API returns: a message with its author denormalized for display. */
export type FeedMessage = Message & { author: FeedUser }

/** The editable slice a compose/edit produces — body + tag (F2/F3/F8). Client-safe. */
export type MessageDraft = { body: string; tag: Tag }

/**
 * One page of the feed. `nextCursor` is null at the end of the list. `total` is
 * the count of messages matching the active filter (not just this page) — the same
 * on every page of a filter, so the client can show a loaded/total page count.
 */
export type FeedPage = {
  items: FeedMessage[]
  nextCursor: string | null
  total: number
}

/**
 * The filter contract, mirrored 1:1 from the URL (ADR-002). Owner and tag are
 * multi-select; date is a range (a single instant isn't a useful filter — O3).
 *
 * `from`/`to` are absolute instants (`toISOString()`), because the range now
 * carries a time (F6): the picker reads local wall-clock but `createdAt` is UTC,
 * so the conversion has to happen before the bound reaches the URL — otherwise
 * "since 10:30" would mean 10:30 UTC to everyone outside it. A bare `YYYY-MM-DD`
 * is still accepted and means the whole UTC day, so older links keep working.
 */
export type FeedFilters = {
  user?: string[] // FeedUser["id"][]
  tag?: Tag[]
  from?: string // ISO instant (or YYYY-MM-DD), inclusive
  to?: string // ISO instant (or YYYY-MM-DD), inclusive
}
