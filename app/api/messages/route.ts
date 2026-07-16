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
 * The feed's collection endpoint (ADR-001, B4). Thin by design: parse and
 * validate, then hand off to the @dmb/feed store. Cursor pagination and the
 * filter/write contracts live in the feature package; this file only speaks HTTP.
 * Dynamic by necessity — it reads request params and the session cookie (Q1).
 *
 *   GET  — read one filtered page (session-gated, owner-stamped per viewer)
 *     ?user=u_adam&user=u_eva   repeatable — owner filter (F7)
 *     ?tag=PRODUCT&tag=DESIGN   repeatable — tag filter (F5)
 *     ?from=2026-07-01T07:30:00.000Z&to=…  inclusive range (F6); a bare
 *                               YYYY-MM-DD still means the whole UTC day
 *     ?cursor=…&limit=20        cursor pagination (F10, ADR-004)
 *   POST — create a message (F2/F3), optimistically inserted client-side first
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

  // Mock latency so `LOAD MORE` actually shows its loading state (ADR-005 latency).
  await mockLatency()
  const { items, nextCursor, total } = getMessages(parsed.data)
  // Stamp the per-viewer ownership flag here, where the session is available, so
  // appended rows carry the same F8/F9 affordance the first page gets (rbac).
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

  // One latency per request, once the guards have passed — every path from here
  // stands in for a store round-trip, including the simulated failure.
  await mockLatency()

  // Simulated failure (ADR-005): lets the client demonstrate optimistic rollback.
  if (forceFailure(parsed.data.body)) {
    return Response.json({ error: "Simulated failure" }, { status: 500 })
  }

  const message = addMessage(parsed.data, session.id)
  const author = authorOf(message.createdBy) ?? userFromIdentity(session)
  const created: FeedMessage = { ...message, author }
  // Owner is always the poster — stamp it so the returned row swaps cleanly into
  // the optimistic temp row (which is already `owner: true`).
  return Response.json(withOwnership(created, session.id), { status: 201 })
}
