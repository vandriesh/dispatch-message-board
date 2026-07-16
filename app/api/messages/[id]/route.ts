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

// Edit and delete, author-only. The store enforces ownership and reports why
// it refused; this file maps that to a status and speaks HTTP.
type Ctx = { params: Promise<{ id: string }> }

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

  await mockLatency()
  if (forceFailure(body)) {
    return Response.json({ error: "Simulated failure" }, { status: 500 })
  }

  const { id } = await params
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

  // Simulated failure: deleting a message whose body contains "keep" 500s to
  // exercise the rollback path. Only for the author, so a non-author still 403s.
  const target = findMessage(id)
  if (target && target.createdBy === session.id && forceDeleteFailure(target.body)) {
    return Response.json({ error: "Simulated failure" }, { status: 500 })
  }

  const result = deleteMessage(id, session.id)
  if (!result.ok) return refusal(result)

  return new Response(null, { status: 204 })
}
