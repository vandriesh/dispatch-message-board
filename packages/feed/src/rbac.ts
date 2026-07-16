/**
 * Authorship RBAC — one rule: a message may be edited or deleted only by its
 * author. Framework-free because the same predicate is the server-side gate in
 * the mutations *and* toggles the edit/delete controls in the client UI.
 */
import type { FeedMessage, Message } from "./message"

export function isOwner(
  userId: string | null | undefined,
  message: Pick<Message, "createdBy">,
): boolean {
  return userId != null && userId === message.createdBy
}

// Per-viewer view of a message — never part of the stored model.
export type OwnedMessage = FeedMessage & { owner: boolean }

export type OwnedFeedPage = {
  items: OwnedMessage[]
  nextCursor: string | null
  total: number
}

// `pending` is set by the optimistic layer while a post/edit is unconfirmed.
export type FeedRow = OwnedMessage & { pending?: boolean }

/**
 * Stamp the per-viewer `owner` flag at the server boundary, where the httpOnly
 * session is readable. Display convenience only — the real gate is `isOwner`
 * re-checked inside the mutations; a hidden button is not a permission.
 */
export function withOwnership(
  message: FeedMessage,
  userId: string | null | undefined,
): OwnedMessage {
  return { ...message, owner: isOwner(userId, message) }
}
