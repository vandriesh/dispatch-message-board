import { getSession } from "@/app/(auth)/session"

import { authorOf, userFromIdentity, withOwnership, type FeedMessage } from "@dmb/feed"
import {
  addMessage,
  feedQuerySchema,
  forceFailure,
  getMessages,
  mockLatency,
  postMessageSchema,
} from "@dmb/feed/server"

/**
 * Thin by design: parse and validate, then hand off to @dmb/feed — this file
 * only speaks HTTP.
 *
 *   GET  ?user=…&tag=… (repeatable) &from=…&to=… (inclusive) &cursor=…&limit=…
 *   POST { body, tag }
 */
export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)

  const parsed = feedQuerySchema.safeParse({
    user: searchParams.getAll("user"),
    tag: searchParams.getAll("tag"),
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    cursor: searchParams.get("cursor") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  })

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid query parameters", issues: parsed.error.issues },
      { status: 400 }
    )
  }

  // Mock latency so `LOAD MORE` actually shows its loading state.
  await mockLatency()
  const { items, nextCursor, total } = getMessages(parsed.data)
  return Response.json({
    items: items.map((m) => withOwnership(m, session.id)),
    nextCursor,
    total,
  })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return Response.json({ error: "Not authenticated" }, { status: 401 })

  const parsed = postMessageSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid message", issues: parsed.error.issues },
      { status: 400 }
    )
  }

  await mockLatency()

  // Simulated failure: lets the client demonstrate optimistic rollback.
  if (forceFailure(parsed.data.body)) {
    return Response.json({ error: "Simulated failure" }, { status: 500 })
  }

  const message = addMessage(parsed.data, session.id)
  const author = authorOf(message.createdBy) ?? userFromIdentity(session)
  const created: FeedMessage = { ...message, author }
  // Owner-stamped so the returned row swaps cleanly into the optimistic temp
  // row, which is already `owner: true`.
  return Response.json(withOwnership(created, session.id), { status: 201 })
}
