import "server-only"

import { z } from "zod"

import { TAGS, type Message } from "./message"
import { isOwner } from "./rbac"
import { messagesStore } from "./store"

/** The body cap shared with the composer (F2). */
const MAX_BODY = 240

/**
 * The write side of the store (F2/F3/F8/F9), sitting behind the POST/PATCH/DELETE
 * route handlers exactly as `getMessages` sits behind GET. Pure over the in-memory
 * store and framework-free, so the ownership gate and validation are testable
 * without a router — and swapping the mock store for a durable one stays a change
 * to this module and `store.ts` alone (ADR-001).
 */

/** POST body: a non-empty message within the 240 cap (F2), carrying one tag (F3). */
export const postMessageSchema = z.object({
  body: z.string().trim().min(1).max(MAX_BODY),
  tag: z.enum(TAGS),
})
export type PostMessageInput = z.infer<typeof postMessageSchema>

/**
 * The demo failure switches (ADR-005), so every optimistic rollback path is
 * demonstrable on command rather than theoretical.
 *
 * Two words, because one can't cover all three verbs: `fail` rejects a *write*, so
 * a "fail" message can never be saved — which means it could never exist to fail a
 * *delete*. Delete therefore keys off a word that IS writable, `keep` ("keep this
 * forever"): post it, then watch its delete roll back.
 *
 *   - post / edit → body contains "fail"  → 500
 *   - delete      → stored body contains "keep" → 500
 */
export const forceFailure = (body: string): boolean => /fail/i.test(body)
export const forceDeleteFailure = (body: string): boolean => /keep/i.test(body)

/**
 * The outcome of an authorship mutation. `forbidden` is the ownership gate
 * firing — re-checked here on the server against the freshly looked-up record,
 * regardless of whether the client ever showed the control. A hidden button is
 * not a permission; this is where the rule is actually enforced.
 */
export type MutationResult =
  | { ok: true; message: Message }
  | { ok: false; error: "not_found" | "forbidden" | "invalid" }

/** Peek a message by id without mutating — used to decide simulated-delete failure. */
export const findMessage = (id: string): Message | undefined =>
  messagesStore.find((m) => m.id === id)

/** Insert a new message at the top of the store (newest-first) and return it (F2/F3). */
export function addMessage(input: PostMessageInput, createdBy: string): Message {
  const message: Message = {
    id: `m_${crypto.randomUUID()}`,
    body: input.body,
    tag: input.tag,
    createdBy,
    createdAt: new Date().toISOString(),
  }
  messagesStore.unshift(message)
  return message
}

/**
 * Edit a message's body (F8). Looks the record up in the store, re-checks
 * ownership with `isOwner`, validates the new body, then mutates in place.
 */
export function editMessage(
  id: string,
  actorId: string,
  body: string,
): MutationResult {
  const message = messagesStore.find((m) => m.id === id)
  if (!message) return { ok: false, error: "not_found" }
  if (!isOwner(actorId, message)) return { ok: false, error: "forbidden" }

  const next = body.trim()
  if (next.length === 0 || next.length > MAX_BODY) {
    return { ok: false, error: "invalid" }
  }

  message.body = next
  return { ok: true, message }
}

/** Delete a message (F9). Same server-side ownership gate as `editMessage`. */
export function deleteMessage(id: string, actorId: string): MutationResult {
  const index = messagesStore.findIndex((m) => m.id === id)
  if (index === -1) return { ok: false, error: "not_found" }
  if (!isOwner(actorId, messagesStore[index])) {
    return { ok: false, error: "forbidden" }
  }

  const [removed] = messagesStore.splice(index, 1)
  return { ok: true, message: removed }
}
