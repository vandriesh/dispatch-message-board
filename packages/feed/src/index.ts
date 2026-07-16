/**
 * @dmb/feed — the client-safe entry point. It deliberately does NOT re-export
 * the store or `getMessages` — those live behind `@dmb/feed/server`, so a
 * client importing from here can never drag faker into the bundle.
 */

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

export {
  isOwner,
  withOwnership,
  type FeedRow,
  type OwnedFeedPage,
  type OwnedMessage,
} from "./rbac"

export { FeedFilterBar } from "./filter/feed-filter-bar"
export { FeedSection } from "./filter/feed-section"

// Exported so /ui-kit renders the real states rather than replicas.
export { FeedEmpty } from "./feed-empty"
export { MessageSkeleton } from "./message-skeleton"
