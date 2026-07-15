import { feedQuerySchema, getMessages } from "@dmb/feed/server"

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
 */
export async function GET(request: Request) {
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

  return Response.json(getMessages(parsed.data))
}
