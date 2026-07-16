import "server-only"

import { z } from "zod"

import { TAGS, type Message } from "./message"
import { isOwner } from "./rbac"
import { messagesStore } from "./store"

const MAX_BODY = 240

export const postMessageSchema = z.object({
  body: z.string().trim().min(1).max(MAX_BODY),
  tag: z.enum(TAGS),
})
export type PostMessageInput = z.infer<typeof postMessageSchema>

/**
 * Demo failure switches, so every optimistic rollback is demonstrable on
 * command. Two words because one can't cover all three verbs: a "fail" body can
 * never be saved, so it could never exist to fail a *delete* — delete keys off
 * a word that IS writable.
 *
 *   - post / edit → body contains "fail"  → 500
 *   - delete      → stored body contains "keep" → 500
 */
export const forceFailure = (body: string): boolean => /fail/i.test(body)
export const forceDeleteFailure = (body: string): boolean => /keep/i.test(body)

// `forbidden` is the ownership gate firing server-side, regardless of whether
// the client ever showed the control — a hidden button is not a permission.
export type MutationResult =
  | { ok: true; message: Message }
  | { ok: false; error: "not_found" | "forbidden" | "invalid" }

/** Peek without mutating — used to decide simulated-delete failure. */
export const findMessage = (id: string): Message | undefined =>
  messagesStore.find((m) => m.id === id)

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

export function deleteMessage(id: string, actorId: string): MutationResult {
  const index = messagesStore.findIndex((m) => m.id === id)
  if (index === -1) return { ok: false, error: "not_found" }
  if (!isOwner(actorId, messagesStore[index])) {
    return { ok: false, error: "forbidden" }
  }

  const [removed] = messagesStore.splice(index, 1)
  return { ok: true, message: removed }
}
