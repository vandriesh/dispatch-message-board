"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { deleteMessage, editMessage } from "@dmb/feed/server"

import { getSession } from "@/app/(auth)/session"

/**
 * Author-only feed mutations (F8/F9). These are the real authorization boundary:
 * they read the session server-side and hand the *session* id to the store's
 * `isOwner` re-check — the client never supplies the actor id, and the EDIT/DELETE
 * buttons are only an affordance. A missing session redirects to /login rather
 * than mutating.
 *
 * On success `revalidatePath("/feed")` refreshes the server-rendered first page;
 * the card also updates itself optimistically so client-appended LoadMore rows,
 * which revalidation can't reach, stay in sync.
 */
export type ActionResult = { ok: true } | { ok: false; error: string }

export async function editMessageAction(
  id: string,
  body: string,
): Promise<ActionResult> {
  const session = await getSession()
  if (!session) redirect("/login")

  const result = editMessage(id, session.id, body)
  if (!result.ok) return { ok: false, error: result.error }

  revalidatePath("/feed")
  return { ok: true }
}

export async function deleteMessageAction(id: string): Promise<ActionResult> {
  const session = await getSession()
  if (!session) redirect("/login")

  const result = deleteMessage(id, session.id)
  if (!result.ok) return { ok: false, error: result.error }

  revalidatePath("/feed")
  return { ok: true }
}
