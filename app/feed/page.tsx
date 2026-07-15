import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { getSession } from "@/app/(auth)/session"

import {
  FeedClient,
  TAGS,
  userFromIdentity,
  withOwnership,
  type FeedFilters,
  type Tag,
} from "@dmb/feed"
import { getMessages, mockLatency } from "@dmb/feed/server"

import { FeedFilterBar } from "./feed-filter-bar"

export const metadata: Metadata = {
  title: "Feed — Dispatch",
}

const PAGE_SIZE = 20
const TAG_SET = new Set<string>(TAGS)

type SearchParams = Record<string, string | string[] | undefined>

/** Read the URL's filter params into the FeedFilters contract (ADR-002). */
function parseFilters(sp: SearchParams): FeedFilters {
  const many = (v: string | string[] | undefined) =>
    v === undefined ? undefined : Array.isArray(v) ? v : [v]
  const one = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v

  const tag = many(sp.tag)?.filter((t): t is Tag => TAG_SET.has(t))

  return {
    user: many(sp.user),
    tag: tag && tag.length > 0 ? tag : undefined,
    from: one(sp.from),
    to: one(sp.to),
  }
}

/**
 * The feed page (F4) — the container in the container/presentational split.
 *
 * It guards its own session first, then reads the filter params, fetches the first
 * filtered page on the server, and stamps each row with the per-viewer `owner`
 * flag (rbac) at this boundary — the one place with the session — so the store
 * stays viewer-agnostic and the client never re-derives ownership. Pages 2..n get
 * the same stamp in the `/api/messages` route. A mock latency runs first so the
 * streaming skeleton (app/feed/loading.tsx) is actually seen (F11, ADR-005).
 *
 * The owner-stamped first page, the filters, and the logged-in user are handed to
 * `FeedClient`, which owns the query cache and the optimistic post/edit/delete.
 */
export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  const filters = parseFilters(await searchParams)
  await mockLatency()
  const { items, nextCursor } = getMessages({ ...filters, limit: PAGE_SIZE })
  const initialPage = {
    items: items.map((m) => withOwnership(m, session.id)),
    nextCursor,
  }
  const currentUser = userFromIdentity(session)

  return (
    <main className="mx-auto grid w-full max-w-[1120px] grid-cols-1 gap-8 p-4 lg:grid-cols-[296px_1fr] lg:p-8">
      <FeedFilterBar value={filters} />

      <section className="flex min-w-0 flex-col gap-4">
        {/* Remounted per filter set so a filter change resets query + optimistic state. */}
        <FeedClient
          key={JSON.stringify(filters)}
          initialPage={initialPage}
          filters={filters}
          currentUser={currentUser}
        />
      </section>
    </main>
  )
}
