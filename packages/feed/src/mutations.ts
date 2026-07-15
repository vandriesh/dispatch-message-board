import "server-only"

import type { Message } from "./message"
import { isOwner } from "./rbac"
import { messagesStore } from "./store"

/** The body cap shared with the composer (F2). */
const MAX_BODY = 240

/**
 * The outcome of an authorship mutation. `forbidden` is the ownership gate
 * firing — re-checked here on the server against the freshly looked-up record,
 * regardless of whether the client ever showed the control. A hidden button is
 * not a permission; this is where the rule is actually enforced.
 */
export type MutationResult =
  | { ok: true; message: Message }
  | { ok: false; error: "not_found" | "forbidden" | "invalid" }

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
