# Dispatch — Message Board

## Install & Run

Node **20.9+**. No env vars, no `.env` — the backend is mocked in-process.

```bash
npm install
npm run dev     # http://localhost:3000
```

Also: `npm test` · `npm run build` · `npm run lint`. Design system at `/ui-kit`.


## Login

**Log in with a seeded account — the password *is* the email:** `adam@dispatch.dev`,
`eva@dispatch.dev`, or `snake@dispatch.dev` (e.g. `eva@dispatch.dev` / `eva@dispatch.dev`).
A mismatch fails on purpose, so the error state has something real to do.

## Structure

Modular **by feature, not by file type** — no top-level `components/` or `utils/` bucket.
Features are workspace packages, so the **module graph enforces the boundary** instead of
discipline: `@dmb/ui-kit` *cannot* import a feature, and faker *cannot* reach the client bundle.

The domain is deliberately **framework-agnostic** — `@dmb/feed` could be dropped into any
React-based framework (Next.js, Remix/RR8, TanStack Start) without touching domain code. The
one exception is by design: filters live in the URL, so exactly **two files** in `filter/`
import `next/navigation`. They're the **adapter** to the host framework's router — the only
seam a migration rewrites; the model, store, cards, and mutations never learn where they run.

```
app/                    # router surface ONLY — wires, never implements
  (auth)/login/         #   Server Action + cookie session
  api/messages/         #   real route handlers: GET POST PATCH DELETE
  feed/                 #   page.tsx (SSR first page) + loading.tsx (skeleton)
packages/
  ui-kit/               # @dmb/ui-kit — design primitives, zero domain knowledge
  auth/                 # @dmb/auth  — login form + schema, imports no next/*
  feed/src/             # @dmb/feed  — the domain
    message.ts          #   model; types defined where the data is born
    store.ts query.ts   #   server-only: faker seed + cursor read  ← never client
    feed-client.tsx     #   container: useInfiniteQuery + optimistic mutations
    feed.tsx            #   the virtualized list
    filter/             #   URL-synced filters (only place touching next/navigation)
```

Two entry points per feature: `@dmb/feed` is client-safe, `@dmb/feed/server` is `server-only`.
That split is why ~5MB of faker can never be bundled.

## Checklist

| ✓ |                                                  |
|---|--------------------------------------------------|
| ✅ | Login — seeded users, no sign-up                 |
| ✅ | Post ≤240 chars with a tag                       |
| ✅ | Feed filtered by tag / user / date & time        |
| ✅ | Author-only inline edit + delete (RBAC)          |
| ✅ | Pagination (`LOAD MORE`) **and** infinite scroll |
| ✅ | Loading + empty states                           |
| ✅ | Responsive (mobile + desktop)                    |
| ✅ | Filters in the URL — shareable/bookmarkable      |

## Beyond the brief

- **Mobile filter** — the desktop rail eats too much height on a phone, so user/date hide
  behind the `⚙` cog. Tags stay one tap away as a **most-recent-first row** (first 3 shown):
  a new pick jumps to the front, tapping the active chip clears it, and the row seeds from the
  URL, so a shared `?tag=` link opens with its chip already set. One tag at a time (radio).
- **Optimistic filtering** — the tapped chip lights up *immediately* with a pending spinner
  instead of after the ~1.2s reconcile. An `n/N pages` readout sits under the list.
- **Two-step delete** — `DELETE` swaps to confirm/cancel in place; no modal.
- **A failed post keeps your text** — the rejected draft is handed back to the composer, and
  each error renders under whatever caused it (the composer, or that row).
- **Mobile top bar** folds handle + `LOG OUT` behind the avatar (toggle popup). 
- `/ui-kit` browses every primitive, so design drift stays visible.

## Suggestions
- **An `Apply` button on the filter area** — every control commits on change, so walking
  tag → user → date fires a request each, and the in-flight ones are dropped as the next one
  supersedes them. Stage the pending filters locally and commit them in **one** navigation on
  `Apply`. Worth most now the range carries a time (four inputs = four wasted round-trips).
- Mobile Filtering improvements - use tags like `[user: @adam x]` `[tag: RANDOM x]` -
  deletable tags - easier to reset the tag filter.
- **Collapse the composer on mobile** — it owns a lot of a phone screen for an occasional
  action. Fold it behind an edit icon in the top bar that toggles it open/shut.
- **E2E with Playwright** — for the critical paths: login → post → filter → edit/delete. RTL
  can't reach the Server Action + cookie + redirect glue; a real browser can.
- **CI/CD** — Actions on PR: typecheck, lint, test, build, + a **bundle-size budget** that
  fails on regression.

## Bonus Points

- **Virtualization** — `@tanstack/react-virtual`: ~10–13 DOM rows for 1000, dynamically
  measured (rows wrap and grow in edit). `LOAD ALL` fills the feed in one request, so it's
  demonstrable without 50 clicks.
- **Optimistic UI + rollback** — Query `onMutate`/`onError`. Use magic words:
  - CREATE/EDIT: a body containing **`fail`** → the write 500s and the row rolls back;
  - DELETE: delete a stored message containing **`keep`** → the delete 500s and the row comes
    back. (`keep`, not `fail` — a `fail` body can never be saved, so it could never exist to
    be deleted.)

  A ~1.2s mock latency is added for demoing optimistic UI.
- **Real route handlers** — cursor pagination, zod at the boundary, author enforced server-side.
- **Tests** — 17, across three flows: the login form, the optimistic rollback, and the date
  range (bounds are inclusive, filter at instant precision, and a bare `yyyy-mm-dd` still means
  the whole UTC day — the one that guards the older shared links).


## Bonus Questions

**Q: What rendering strategy (SSR, SSG, ISR, CSR) would you use for each page and why?**

> few pages are static (SSG), the rest SSR
>
> **What `npm run build` actually reports** — the strategy is a build fact, not an intention:
>
> ```
> Route (app)
> ┌ ƒ /                      ← reads the session cookie to redirect
> ├ ○ /_not-found
> ├ ƒ /api/messages          ← session + filter params
> ├ ƒ /api/messages/[id]     ← session + request body
> ├ ƒ /feed                  ← session cookie + searchParams
> ├ ○ /login
> └ ○ /ui-kit
>
> ○  (Static)   prerendered as static content
> ƒ  (Dynamic)  server-rendered on demand
> ```
>
> - one test per page — does the HTML depend on the request (cookies, `searchParams`, headers)? yes → dynamic SSR, no → SSG
> - `/feed` is dynamic because of the **filters**, not the login — the client holds 20 of 1000 rows, so filtering must ask the server; the URL carries the filter so the view stays shareable and there's no client mirror to drift

**Q: How would you keep the bundle small and avoid unnecessary re-renders as the feature set grows?**

> **Bundle** — every number below is measured off `npm run build`, not cited.
>
> - Server Components by default; `"use client"` where interaction lives — the feed list included, since the optimistic overlay needs a client-owned cache
> - virtualize long lists — ~10–13 DOM rows for 1000 (`feed.tsx:4,68`)
> - know each lib's cost — react-day-picker **16.3kb gzip** (measured, the heaviest) · Query ~13kb (cited) · react-virtual tiny, and it *cuts* DOM work
> - **code splitting, demoed on the calendar** — `React.lazy`'d and fetched on first popover open (`filter/date-time-field.tsx`); verified: **0 of the 15** chunks on `/feed`'s initial load contain it
> - a popover defers *rendering*, not *downloading* — a static `import` ships the bytes regardless; only a dynamic `import()` moves them. Import the module, not the `@dmb/ui-kit` barrel, or the whole kit lands in the chunk. `React.lazy`, not `next/dynamic`, so `@dmb/feed` stays framework-agnostic
> - the calendar is deliberately the demo — a native `<input type="date">` satisfied F6 first (`ebad5e6`), and date **& time** could be a `datetime-local`; a real, heavy, genuinely-deferrable dep shows the trade better than a contrived one
> - not done — `date-fns` is **14.6kb still eager** (2 chunks × 7.3kb): one `import { format }` pins it (`date-time-field.tsx:5`), so it can't follow the calendar into the lazy chunk. `Intl.DateTimeFormat` would free it
> - split by *structure*, not by viewport — lazy-loading the mobile filter would defer **131 lines** and *not* the calendar (it reuses `feed-filters.tsx`), while costing SSR of the URL-seeded tag chip. Behind a popover there's nothing to lose
> - *next:* size budget in CI — fail the build on growth instead of guessing
>
> **Re-renders**
> - using virtualizing - "work" with a small number of items loaded; 
> - `FeedClient` **is** remounted per filter set (keyed, `filter/feed-section.tsx:55`) — a deliberate reset of the query cache + optimistic state, not a stray cascade
> - keep the state as low as possible (in our case at the leaf) — the edit row owns its draft, so typing can't re-render the other 999 (`owner-message-card.tsx:36,37,113`)
> - stable keys by id — virtual rows get reused, not rebuilt (`feed.tsx:75,99`)

**Q: What would you check first if users reported the feed felt janky while scrolling? What would be your debugging steps to isolate the performance bottleneck?**

> **Check first**
>
> Supposedly janky scrolling is a classic symptom when we have a lot of rows. Virtualizer to the rescue.
>
> - reproduce at the volume that triggers it — 1000+ rows;
>
> **Isolate the bottleneck**
> - record, analyze with React Profiler — *which* rows re-render, and why (context value / new object identity in a provider)
> - fix one thing, re-measure against the same trace
> - prior for an unvirtualized 1000-row feed: node count first, unmemoized row second
