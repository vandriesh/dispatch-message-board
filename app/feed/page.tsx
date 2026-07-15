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
import { FeedFilterMobile } from "./feed-filter-mobile"

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
 * streaming skeleton (app/feed/loading.tsx) is actually seen (F11, ADR-005). The
 * owner-stamped first page, the filters, and the logged-in user are handed to
 * `FeedClient`, which owns the query cache and the optimistic post/edit/delete.
 *
 * The page is an app shell: `main` is exactly the viewport minus the top bar and
 * never itself scrolls. `FeedClient` lays out its column so the composer (and,
 * below `lg`, the mobile filter passed in as `mobileFilter`) stay pinned at the
 * top, the messages scroll in the space that's left, and LOAD MORE is parked at
 * the bottom. Desktop keeps the two-column layout — the FILTERS rail (296px) at
 * left, the shell at right; below `lg` it is a single column and the rail
 * collapses into the cog panel. `FeedClient` is remounted per filter set so a
 * filter change resets the query cache and optimistic state (ADR-004).
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
    <main className="mx-auto flex h-[calc(100dvh-60px)] w-full max-w-[1120px] flex-col gap-8 overflow-hidden p-4 sm:h-[calc(100dvh-72px)] lg:flex-row lg:p-8">
      {/* Desktop rail; hidden below lg, where the cog panel under the composer
          takes over (F5–F7 on mobile). */}
      <div className="hidden lg:block lg:w-[296px] lg:shrink-0">
        <FeedFilterBar value={filters} />
      </div>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        {/* Remounted per filter set so a filter change resets query + optimistic state. */}
        <FeedClient
          key={JSON.stringify(filters)}
          initialPage={initialPage}
          filters={filters}
          currentUser={currentUser}
          mobileFilter={<FeedFilterMobile value={filters} />}
        />
      </section>
    </main>
  )
}
