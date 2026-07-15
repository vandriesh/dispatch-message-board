/**
 * @dmb/feed — authorship RBAC.
 *
 * The feed has exactly one authorization rule: a message may be edited or
 * deleted only by its author (F8/F9). "Author" is the session user whose id
 * equals the message's `createdBy` — note that is the *author* id, not the
 * message's own `id`. The two ids line up because both sides mint ids with the
 * same `u_${localpart}` convention (see USERS in `message.ts` and the session
 * endpoint), so ownership is a plain id equality.
 *
 * Client-safe and framework-free on purpose (no `next/*`, no store). The same
 * predicate has to run in two places: it is the real gate inside the server
 * mutation, and it toggles the edit/delete affordances in the client UI. Keeping
 * it here — beside the model it reasons about — lets both import it.
 */
import type { FeedMessage, Message } from "./message"

/**
 * Whether `userId` owns `message`, and may therefore edit or delete it.
 *
 * Pass the session user's id (`session?.id`); a null/undefined id (no session)
 * is never an owner. Accepts anything carrying `createdBy`, so a full
 * `FeedMessage` or a bare `{ createdBy }` both work.
 *
 * This is the single source of truth for the rule. It runs in two roles:
 * `withOwnership` calls it on the server to stamp the display flag below, and the
 * edit/delete mutation calls it again — server-side — as the authoritative gate.
 */
export function isOwner(
  userId: string | null | undefined,
  message: Pick<Message, "createdBy">,
): boolean {
  return userId != null && userId === message.createdBy
}

/**
 * A feed message decorated with whether the *current viewer* owns it — the flag
 * the UI reads to show the EDIT/DELETE controls. It is a per-viewer view of the
 * message, so it is never part of the stored model.
 */
export type OwnedMessage = FeedMessage & { owner: boolean }

/** One page of owned messages — the shape `GET /api/messages` returns. */
export type OwnedFeedPage = { items: OwnedMessage[]; nextCursor: string | null }

/**
 * A feed row as the client renders it: an `OwnedMessage` plus an optional
 * `pending` flag the optimistic layer sets while a post/edit is unconfirmed
 * (ADR-005). UI-only — it never touches the stored `Message`.
 */
export type FeedRow = OwnedMessage & { pending?: boolean }

/**
 * Stamp the per-viewer `owner` flag onto a message.
 *
 * Called only at the server boundary (the feed page and the route handler),
 * where the session id is available — the client can't read the httpOnly session
 * cookie and so cannot forge this. The flag is a *display convenience*: it
 * decides whether the controls render, not whether a mutation is allowed. The
 * real gate is `isOwner` re-checked inside the edit/delete action against a
 * freshly loaded message, because a hidden button is not a permission.
 */
export function withOwnership(
  message: FeedMessage,
  userId: string | null | undefined,
): OwnedMessage {
  return { ...message, owner: isOwner(userId, message) }
}
