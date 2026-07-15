import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { getSession } from "@/app/(auth)/session"

import {
  Composer,
  Feed,
  FeedEmpty,
  LoadMore,
  TAGS,
  withOwnership,
  type FeedFilters,
  type MessageActions,
  type Tag,
} from "@dmb/feed"
import { getMessages } from "@dmb/feed/server"

import { deleteMessageAction, editMessageAction } from "./actions"
import { FeedFilterBar } from "./feed-filter-bar"

/** The edit/delete Server Actions, in the shape the cards consume (F8/F9). */
const feedActions: MessageActions = {
  edit: editMessageAction,
  remove: deleteMessageAction,
}

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
 * It guards its own session first: no shared authenticated layout sits above it,
 * so the `!session` redirect is the real gate, not just type-narrowing. The top
 * bar (brand, avatar, LOG OUT) is rendered by the root layout whenever a session
 * exists (the top-bar ADR). Then it reads the filter params, fetches the first
 * filtered page on the server (Q1: dynamic SSR, first page rendered rather than
 * spinner'd), and branches three ways:
 *
 *   loading → app/feed/loading.tsx  (Next's streaming Suspense fallback)
 *   empty   → <FeedEmpty />
 *   data    → <Feed data={…} />
 *
 * Desktop layout (measured from the reference): a centered two-column grid on the
 * gray page — the FILTERS rail (296px) at left, the composer + feed + LOAD MORE at
 * right. It collapses to a single column below `lg`. `LoadMore` is keyed on the
 * active filters so a filter change resets its appended pages (ADR-004).
 */
export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  const filters = parseFilters(await searchParams)
  const { items, nextCursor } = getMessages({ ...filters, limit: PAGE_SIZE })

  // Stamp the per-viewer ownership flag here, at the boundary that has the
  // session — the store stays viewer-agnostic. Pages 2..n get the same treatment
  // in the /api/messages route so appended rows carry the flag too.
  const owned = items.map((m) => withOwnership(m, session.id))

  return (
    <main className="mx-auto grid w-full max-w-[1120px] grid-cols-1 gap-8 p-4 lg:grid-cols-[296px_1fr] lg:p-8">
      <FeedFilterBar value={filters} />

      <section className="flex min-w-0 flex-col gap-4">
        <Composer />
        {owned.length === 0 ? (
          <FeedEmpty />
        ) : (
          <Feed data={owned} actions={feedActions} />
        )}
        <LoadMore
          key={JSON.stringify(filters)}
          filters={filters}
          initialCursor={nextCursor}
          actions={feedActions}
        />
      </section>
    </main>
  )
}
