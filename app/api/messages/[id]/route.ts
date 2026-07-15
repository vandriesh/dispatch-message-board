import { getSession } from "@/app/(auth)/session"

import { authorOf, userFromIdentity, withOwnership, type FeedMessage } from "@dmb/feed"
import {
  deleteMessage,
  editMessage,
  findMessage,
  forceDeleteFailure,
  forceFailure,
  mockLatency,
  type MutationResult,
} from "@dmb/feed/server"

/**
 * A single message's write endpoint — edit (F8) and delete (F9), author-only. The
 * store enforces ownership and reports *why* it refused; this file maps that to a
 * status and speaks HTTP. `params` is a promise in Next 16 (route.md), so it's
 * awaited. Latency + the "fail"/"keep" magic words make the optimistic rollback
 * demoable (ADR-005).
 */
type Ctx = { params: Promise<{ id: string }> }

/** Map the store's refusal reason to an HTTP status. */
function refusal(result: Extract<MutationResult, { ok: false }>): Response {
  const status =
    result.error === "forbidden" ? 403 : result.error === "not_found" ? 404 : 400
  return Response.json({ error: result.error }, { status })
}

export async function PATCH(request: Request, { params }: Ctx) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 })

  const raw = (await request.json().catch(() => null)) as { body?: unknown } | null
  const body = typeof raw?.body === "string" ? raw.body : null
  if (body === null) {
    return Response.json({ error: "Invalid message" }, { status: 400 })
  }

  if (forceFailure(body)) {
    await mockLatency()
    return Response.json({ error: "Simulated failure" }, { status: 500 })
  }

  const { id } = await params
  await mockLatency()
  const result = editMessage(id, session.id, body)
  if (!result.ok) return refusal(result)

  const author = authorOf(result.message.createdBy) ?? userFromIdentity(session)
  const updated: FeedMessage = { ...result.message, author }
  return Response.json(withOwnership(updated, session.id))
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 })

  const { id } = await params
  await mockLatency()

  // Simulated failure keys off the target's own body (ADR-005): delete a message
  // whose body contains "keep" to exercise the rollback (re-insert) path — "keep"
  // rather than "fail" because a "fail" body can never be saved in the first place.
  // Decided before mutating, and only for the author, so a non-author still gets 403.
  const target = findMessage(id)
  if (target && target.createdBy === session.id && forceDeleteFailure(target.body)) {
    return Response.json({ error: "Simulated failure" }, { status: 500 })
  }

  const result = deleteMessage(id, session.id)
  if (!result.ok) return refusal(result)

  return new Response(null, { status: 204 })
}
