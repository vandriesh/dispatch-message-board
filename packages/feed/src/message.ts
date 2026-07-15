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

/** One page of the feed. `nextCursor` is null at the end of the list. */
export type FeedPage = {
  items: FeedMessage[]
  nextCursor: string | null
}

/**
 * The filter contract, mirrored 1:1 from the URL (ADR-002). Owner and tag are
 * multi-select; date is a range (a single instant isn't a useful filter — O3).
 * `from`/`to` are date-only `YYYY-MM-DD`, kept human-readable so a filtered URL
 * reads cleanly when shared.
 */
export type FeedFilters = {
  user?: string[] // FeedUser["id"][]
  tag?: Tag[]
  from?: string // YYYY-MM-DD, inclusive
  to?: string // YYYY-MM-DD, inclusive
}
