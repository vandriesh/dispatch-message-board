import { withOwnership } from "@dmb/feed"
import { feedQuerySchema, getMessages } from "@dmb/feed/server"

import { getSession } from "@/app/(auth)/session"

/**
 * GET /api/messages — the feed's read endpoint (ADR-001, B4). Thin by design: it
 * parses and validates the query, then hands off to the @dmb/feed store. Cursor
 * pagination and the filter contract both live in the feature package; this file
 * only speaks HTTP. Dynamic by necessity — it reads request params (Q1).
 *
 *   ?user=u_adam&user=u_eva   repeatable — owner filter (F7)
 *   ?tag=PRODUCT&tag=DESIGN   repeatable — tag filter (F5)
 *   ?from=2026-07-01&to=…     inclusive date range (F6)
 *   ?cursor=…&limit=20        cursor pagination (F10, ADR-004)
 *
 * Session-gated to match the /feed page: the endpoint is the same data the page
 * renders, so it can't be readable unauthenticated. The session also feeds the
 * per-viewer `owner` stamp on each row (F8/F9), the same one page 1 gets in the
 * feed container.
 */
export async function GET(request: Request) {
  const session = await getSession()
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

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

  const { items, nextCursor } = getMessages(parsed.data)
  return Response.json({
    items: items.map((m) => withOwnership(m, session.id)),
    nextCursor,
  })
}
