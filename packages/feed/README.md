# @dmb/feed

The message feed feature: the domain model, the mock store, cursor pagination, and the
composer / filter / feed UI.

```ts
// client-safe — model + UI
import { Composer, Feed, FeedEmpty, FeedFilterPanel, TAGS, USERS } from "@dmb/feed"
import type { FeedMessage, FeedFilters, Message, Tag } from "@dmb/feed"

// server-only — the store + the read
import { getMessages, feedQuerySchema } from "@dmb/feed/server"
```

## The two entry points, and why they're two

`@dmb/feed` (the main barrel) is **client-safe**: the model, the constants, the UI. `@dmb/feed/server`
is **server-only**: the faker-seeded store and `getMessages`. The split is the whole point —
the store depends on `@faker-js/faker` (~5MB), and `import "server-only"` plus a separate entry
mean a client component that imports from `@dmb/feed` *cannot* drag it into the bundle. The
boundary is enforced by the module graph, not by discipline.

Nothing here imports `next/*`. The Next-aware glue lives in `app/`:

| File | Role |
|---|---|
| `app/api/messages/route.ts` | `GET /api/messages` — parse + validate → `getMessages` → JSON |
| `app/feed/page.tsx` | container: the desktop 2-col grid; server-renders the first filtered page, branches empty/data |
| `app/feed/loading.tsx` | the loading state (Next streaming Suspense fallback) |
| `app/feed/feed-filter-bar.tsx` | wires `FeedFilterPanel` to the URL via `router.replace` |

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
  composer.tsx      # "use client" — the 240-char composer (submit is a no-op for now)
  feed.tsx          # presentational feed list + message card
  feed-empty.tsx    # empty state
  feed-filters.tsx  # "use client" — presentational FILTERS rail: tag chips (multi), user
                    #   dropdown (single, "All users" clears), stacked date range
  load-more.tsx     # "use client" — LOAD MORE button; fetches pages 2..n from the endpoint
```

## What's deferred

- **Posting** — `Composer` submit is a deliberate no-op; the `POST` route with optimistic insert
  and rollback is [ADR-005](../../_ARCHITECTURE.md).
- **Auto-fetch + virtualization** — the `LOAD MORE` button works today; auto-fetch-on-scroll and
  `@tanstack/react-virtual` over 1000+ rows ([ADR-004]/[ADR-006]) wrap `<Feed>` without changing
  its shape. That's the point at which TanStack Query's in-flight dedupe earns its weight.
- **Mobile filter drawer** — filters stack above the feed on mobile; the design's `⚙` drawer is
  a later polish.
