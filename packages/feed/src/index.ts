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
  FEED_PAGE_SIZE,
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

// Feature UI. The two entry points the route renders: the desktop filter rail
// and the feed section (which owns the query + optimistic mutations via
// FeedClient, and pins the mobile cog filter under the composer). Both, plus the
// URL-aware filter glue and the presentational filter controls, live in ./filter.
export { FeedFilterBar } from "./filter/feed-filter-bar"
export { FeedSection } from "./filter/feed-section"

// The feed's two "nothing here" states (F11), exported for the second consumer:
// /ui-kit renders the real components rather than replicas, so the gallery
// can't drift from what the app shows.
export { FeedEmpty } from "./feed-empty"
export { MessageSkeleton } from "./message-skeleton"
