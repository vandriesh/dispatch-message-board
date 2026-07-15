/**
 * @dmb/feed — the message feed feature.
 *
 * This is the client-safe entry point: the domain model, the seeded users, and
 * the composer/filter/feed UI. It deliberately does NOT re-export the store or
 * `getMessages` — those are `server-only` and live behind `@dmb/feed/server`, so
 * a client importing from here can never drag faker into the bundle.
 */

// Domain model — client-safe, framework-free.
export {
  TAGS,
  USERS,
  authorOf,
  userFromIdentity,
  type FeedFilters,
  type FeedMessage,
  type FeedPage,
  type FeedUser,
  type Message,
  type MessageDraft,
  type Tag,
} from "./message"

// Authorship RBAC — client-safe, framework-free (see rbac.ts).
export {
  isOwner,
  withOwnership,
  type FeedRow,
  type OwnedFeedPage,
  type OwnedMessage,
} from "./rbac"

// Feature UI. `FeedClient` is the container (query + optimistic mutations); it
// composes the composer, feed list, and LOAD MORE internally.
export { FeedClient } from "./feed-client"
export { FeedFilterPanel } from "./feed-filters"
