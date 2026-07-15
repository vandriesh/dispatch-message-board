import "server-only"

/**
 * The server-only entry point (`@dmb/feed/server`). Kept separate from the main
 * barrel so the store and its faker/`server-only` dependencies can never be
 * pulled into a client bundle through a stray re-export. Route handlers and Server
 * Components import from here; the composer and filter UI import from the root.
 */
export { feedQuerySchema, getMessages, type FeedQuery } from "./query"
export {
  addMessage,
  deleteMessage,
  editMessage,
  findMessage,
  forceDeleteFailure,
  forceFailure,
  postMessageSchema,
  type MutationResult,
  type PostMessageInput,
} from "./mutations"
export { MOCK_LATENCY_MS, mockLatency } from "./latency"
