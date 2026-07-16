import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { getSession } from "@/app/(auth)/session"

import {
  FEED_PAGE_SIZE,
  FeedFilterBar,
  FeedSection,
  TAGS,
  userFromIdentity,
  withOwnership,
  type FeedFilters,
  type Tag,
} from "@dmb/feed"
import { getMessages, mockLatency } from "@dmb/feed/server"

export const metadata: Metadata = {
  title: "Feed — Dispatch",
}

const PAGE_SIZE = FEED_PAGE_SIZE
const TAG_SET = new Set<string>(TAGS)

type SearchParams = Record<string, string | string[] | undefined>

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
 * Server-renders the first filtered page and stamps each row's per-viewer
 * `owner` flag here, at the one boundary with the session — the client never
 * re-derives ownership. The mock latency runs first so the streaming skeleton
 * (loading.tsx) is actually seen.
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
  const { items, nextCursor, total } = getMessages({ ...filters, limit: PAGE_SIZE })
  const initialPage = {
    items: items.map((m) => withOwnership(m, session.id)),
    nextCursor,
    total,
  }
  const currentUser = userFromIdentity(session)

  return (
    <main className="mx-auto flex h-[calc(100dvh-60px)] w-full max-w-[1120px] flex-col gap-8 overflow-hidden p-4 sm:h-[calc(100dvh-72px)] lg:flex-row lg:p-8">
      {/* Desktop rail; below lg the cog panel under the composer takes over. */}
      <div className="hidden lg:block lg:w-[296px] lg:shrink-0">
        <FeedFilterBar />
      </div>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <FeedSection
          initialPage={initialPage}
          filters={filters}
          currentUser={currentUser}
        />
      </section>
    </main>
  )
}
