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
  type FeedFilters,
  type FeedMessage,
  type FeedPage,
  type FeedUser,
  type Message,
  type Tag,
} from "./message"

// Feature UI.
export { Composer } from "./composer"
export { Feed } from "./feed"
export { FeedEmpty } from "./feed-empty"
export { FeedFilterPanel } from "./feed-filters"
export { LoadMore } from "./load-more"
