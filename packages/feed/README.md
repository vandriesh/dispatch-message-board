# @dmb/feed

The message feed feature: the domain model, the mock store, cursor pagination, and the
composer / filter / feed UI.

```ts
// client-safe — model + UI (FeedSection is the container: query + optimistic mutations;
// FeedFilterBar is the desktop rail)
import { FeedFilterBar, FeedSection, TAGS, USERS, userFromIdentity } from "@dmb/feed"
import type { FeedMessage, FeedFilters, Message, Tag } from "@dmb/feed"

// server-only — the store, the read, and the writes
import { getMessages, feedQuerySchema } from "@dmb/feed/server"
import { addMessage, editMessage, deleteMessage, mockLatency } from "@dmb/feed/server"
```

## The two entry points, and why they're two

`@dmb/feed` (the main barrel) is **client-safe**: the model, the constants, the UI. `@dmb/feed/server`
is **server-only**: the faker-seeded store and `getMessages`. The split is the whole point —
the store depends on `@faker-js/faker` (~5MB), and `import "server-only"` plus a separate entry
mean a client component that imports from `@dmb/feed` *cannot* drag it into the bundle. The
boundary is enforced by the module graph, not by discipline.

Most of the package imports no `next/*` — the model, store, cards, and `FeedClient` stay
framework-free. The one exception is **`src/filter/`**: filtering is URL-synced (ADR-002), so its
`useFilterQuery` uses `next/navigation`, and the filter entry points (`FeedFilterBar` for the
desktop rail, `FeedSection` for the section) live there beside the presentational controls. The
rest of the Next glue is the route surface in `app/`:

| File | Role |
|---|---|
| `app/api/messages/route.ts` | `GET` (read a page) + `POST` (create) — parse/validate → store → JSON |
| `app/api/messages/[id]/route.ts` | `PATCH` (edit) + `DELETE` — author-only (F8/F9), 403/404 on refusal |
| `app/feed/page.tsx` | thin route: server-renders the first filtered page, hands it to `FeedFilterBar` + `FeedSection` |
| `app/feed/loading.tsx` | the loading state (Next streaming Suspense fallback) |
| `app/providers.tsx` | the `QueryClientProvider` boundary (ADR-006) |

Desktop layout is a centered two-column grid (measured from the reference): a 296px `FILTERS`
rail at left, the composer + feed + `LOAD MORE` at right, `1120px` max width; it collapses to a
single column below `lg`.

## The store (mock "database")

`store.ts` seeds **~1000 messages** for three users (`adam`, `eva`, `snake` @dispatch.dev) once,
with faker:

- **Fixed seed** → reproducible across restarts (shareable URLs + tests stay stable).
- **Pinned to `globalThis`** → survives Next dev HMR instead of re-seeding and reshuffling ids.
- Bodies are capped at **240 chars** (F2); every `createdAt` lands between **2 days ago and
  yesterday** (a rolling 24h window one day back), so the feed reads as recent.

`createdBy` follows the project convention `u_${name}` where `const [name] = email.split("@")` —
the *same* id the session endpoint returns, so author-only edit/delete (F8/F9) will line up.

## The contract

`GET /api/messages` → `{ items: FeedMessage[], nextCursor: string | null }`

| Param | Meaning |
|---|---|
| `user` (repeatable) | owner filter — `u_adam` (F7) |
| `tag` (repeatable) | one or more of `PRODUCT` `DESIGN` `RANDOM` `ANNOUNCE` (F5) |
| `from` / `to` | inclusive date range, `YYYY-MM-DD` (F6) |
| `cursor` | opaque `(createdAt, id)` — **cursor, not offset** (ADR-004) |
| `limit` | page size, default 20, max 100 |

Bad params → `400`. `author` is denormalized onto each item for display. Cursor, not offset,
because the composer inserts at the top mid-scroll — an offset would double-serve or skip rows.

## Structure

```
src/
  message.ts        # model: Message, FeedMessage, Tag/TAGS, FeedUser/USERS, FeedFilters — client-safe
  store.ts          # server-only: faker seed + globalThis singleton
  query.ts          # server-only: getMessages + cursor + feedQuerySchema
  server.ts         # server-only barrel (@dmb/feed/server)
  index.ts          # client-safe barrel (@dmb/feed)
  rbac.ts           # client-safe: isOwner + withOwnership (per-viewer `owner` flag) — F8/F9
  mutations.ts      # server-only: addMessage/editMessage/deleteMessage (isOwner gate) +
                    #   postMessageSchema; forceFailure/forceDeleteFailure (the demo switches)
  latency.ts        # server-only: mockLatency() — one knob, ~1.2s, no-op under test
  composer.tsx      # "use client" — the 240-char composer; posts via onPost
  feed.tsx          # "use client" — the virtualized list (react-virtual); branches each row on `owner`
  simple-card.tsx   # the resting card (chrome + actions slot); owner/default variants
  owner-message-card.tsx # "use client" — author's card: inline EditCard + two-step delete
  feed-empty.tsx    # empty state
  feed-query.ts     # client-safe: query key + URL builder + page fetch (shared by list + mutations)
  feed-client.tsx   # "use client" — the container: useInfiniteQuery + the 3 optimistic mutations
  feed-mutations.ts # "use client" — usePostMessage/useEditMessage/useDeleteMessage (onMutate/onError)
  load-more.tsx     # "use client" — thin LOAD MORE / LOAD ALL buttons over fetchNextPage
  filter/           # the filter concern — URL-synced, so this is the one place that uses next/*
    feed-filters.tsx      # "use client" — presentational controls: FeedFilterPanel (rail),
                          #   TagSelect (mobile single-select), UserDateFilter, tag chips, clear
    use-filter-query.ts   # "use client" — the next/navigation glue: onFilterChange → router.replace
    feed-filter-bar.tsx   # "use client" — desktop rail: FeedFilterPanel wired to the URL
    feed-filter-mobile.tsx # "use client" — mobile cog panel + the MRU single-select tag row
    feed-section.tsx      # "use client" — holds the mobile recency/open state, renders FeedClient
```

## Mutations & the optimistic overlay (ADR-005)

`POST /api/messages`, `PATCH`/`DELETE /api/messages/[id]`. Each mutation applies to the
`["messages", filters]` cache immediately, then reconciles; a non-2xx rolls back and surfaces an
inline error. Edit/delete are **author-only** — enforced in the store, shown only on your own rows.

**Demoing the rollback (the magic words):**

- Post or edit a body containing **`fail`** → the write returns 500 and rolls back.
- Post a body containing **`keep`** (it saves), then delete it → the delete returns 500 and the
  row comes back. (Two words because a `fail` body can never be saved, so it could never exist to
  fail a delete.)

Every write also lags ~1.2s (`mockLatency`) so the optimistic window — and the streaming skeleton
and the LOAD MORE loading label — are actually visible. It's a mock affordance; it goes with the
mock store.

## Pagination, auto-fetch & virtualization (ADR-004/006)

`<Feed>` is virtualized with `@tanstack/react-virtual`: only the visible window plus overscan is
in the DOM (~10–13 rows for 1000), rows are **dynamically measured** (`measureElement`) since a
message wraps and an owner row grows in edit mode, and the scroll container is the app shell's
own (`FeedClient` threads the element in via a state-backed callback ref — a parent ref object
would be `null` when the virtualizer first measures). Three ways to advance the cursor, all over
one `useInfiniteQuery`:

- **`LOAD MORE`** — one page (the focusable, announceable baseline).
- **auto-fetch** — when the virtualizer's last item reaches the end of the loaded array.
- **`LOAD ALL`** — every remaining row in a single request, to demo the virtual list at 1000+
  rows without 50 clicks.

Once nothing's left to fetch, both buttons **stay rendered but disabled**, so the end of the
feed reads as "you're caught up" rather than the control silently disappearing.

## What's deferred

- **Mobile filter drawer** — filters stack above the feed on mobile; the design's `⚙` drawer is
  a later polish.
