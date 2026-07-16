# Dispatch — Message Board

Next.js 16 message board for the SDE Frontend Challenge: seeded users log in, post tagged
messages (≤240 chars), and filter a 1000-row feed by tag, user, and date & time — filters live
in the URL, so any view is shareable.

Full reasoning: [_ARCHITECTURE.md](_ARCHITECTURE.md) · tracked brief: [_REQUIREMENTS.md](_REQUIREMENTS.md).

## Install & Run

Node **20.9+**. No env vars, no `.env` — the backend is mocked in-process.

```bash
npm install
npm run dev     # http://localhost:3000
```

**Log in with a seeded account — the password *is* the email:** `adam@dispatch.dev`,
`eva@dispatch.dev`, or `snake@dispatch.dev` (e.g. `eva@dispatch.dev` / `eva@dispatch.dev`).
A mismatch fails on purpose, so the error state has something real to do.

Also: `npm test` · `npm run build` · `npm run lint`. Design system at `/ui-kit`.

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

| ✓ | |
|---|---|
| ✅ | Login — seeded users, no sign-up |
| ✅ | Post ≤240 chars with a tag |
| ✅ | Feed filtered by tag / user / date **& time** |
| ✅ | Author-only inline edit + delete |
| ✅ | Pagination (`LOAD MORE`) **and** infinite scroll |
| ✅ | Loading + empty states |
| ✅ | Responsive (mobile + desktop) |
| ✅ | Filters in the URL — shareable/bookmarkable |

## Beyond the brief

- **Mobile filter** — the desktop rail eats too much height on a phone, so user/date hide
  behind the `⚙` cog. Tags stay one tap away as a **most-recent-first row** (first 3 shown):
  a new pick jumps to the front, tapping the active chip clears it, and the row seeds from the
  URL, so a shared `?tag=` link opens with its chip already set. One tag at a time (radio).
- **Optimistic filtering** — the tapped chip lights up *immediately* with a pending spinner
  instead of after the ~1.2s reconcile. An `n/N pages` readout sits under the list.
- **The date range means one moment, not one reading** — the design's `DATE` is two date
  fields, but the brief asks for date **& time**, so each end pairs a calendar popover with a
  time input. The controls read your local clock and commit a UTC instant, so `?from=…Z` picks
  out the same moment wherever the link is opened — a floating `10:30` would quietly mean
  something different in every timezone. Picking only a day still covers the whole day, and a
  bare `yyyy-mm-dd` still works, so older links don't rot. Detail: ADR-014.
- **Two-step delete** — `DELETE` swaps to confirm/cancel in place; no modal.
- **A failed post keeps your text** — the rejected draft is handed back to the composer, and
  each error renders under whatever caused it (the composer, or that row).
- **Mobile top bar** folds handle + `LOG OUT` behind the avatar. 
- `/ui-kit` browses every primitive, so design drift stays visible.

## Suggestions
- **An `Apply` button on the filter area** — every control commits on change, so walking
  tag → user → date fires a request each, and the in-flight ones are dropped as the next one
  supersedes them. Stage the pending filters locally and commit them in **one** navigation on
  `Apply`. Worth most now the range carries a time (four inputs = four wasted round-trips).
- Mobile Filtering improvements - use tags like `[user: @adam x]` `[tag: RANDOM x]` -
  deletable tags - easier to reset the tag filter.
- **E2E with Playwright** — for the critical paths: login → post → filter → edit/delete. RTL
  can't reach the Server Action + cookie + redirect glue; a real browser can.
- **Collapse the composer on mobile** — it owns a lot of a phone screen for an occasional
  action. Fold it behind an edit icon in the top bar that toggles it open/shut.
- **CI/CD** — Actions on PR: typecheck, lint, test, build, + a **bundle-size budget** that
  fails on regression. Small bundles are a process, not a cleanup.
- **Deployment** — Vercel. The in-memory store isn't deploy-safe across serverless
  invocations; swap it behind the same route handlers — the contract doesn't move.
- **`next/dynamic` for `react-day-picker`** — the heaviest dep, and the date+time range mounts
  it only when the popover opens. Lazy-loading it moves the cost onto the people who actually
  filter, and a popover is already a beat where a delay reads as normal — so there's no flash
  to pay for, and no layout to shift.

## Bonus Points

- **Virtualization** — `@tanstack/react-virtual`: ~10–13 DOM rows for 1000, dynamically
  measured (rows wrap and grow in edit). `LOAD ALL` fills the feed in one request, so it's
  demonstrable without 50 clicks.
- **Optimistic UI + rollback** — Query `onMutate`/`onError`. Use magic words:
  - CREATE/EDIT: a body containing **`fail`** → the write 500s and the row rolls back;
  - DELETE: delete a stored message containing **`keep`** → the delete 500s and the row comes
    back. (`keep`, not `fail` — a `fail` body can never be saved, so it could never exist to
    be deleted.)

  A ~1.2s mock latency makes the window visible.
- **Real route handlers** — cursor pagination, zod at the boundary, author enforced server-side.
- **Tests** — 17, across three flows: the login form, the optimistic rollback, and the date
  range (bounds are inclusive, filter at instant precision, and a bare `yyyy-mm-dd` still means
  the whole UTC day — the one that guards the older shared links).

### Test approach — and why there's no MSW

`msw` is in `package.json` but **nothing imports it**. Not an oversight to hide — it's the
conclusion:

- **Login has no network to mock.** It's a Server Action: the client posts to an encoded action
  id, so there's no `fetch` to intercept. The form takes its submit **action as a prop** — the
  route injects the real Server Action, the test injects a `vi.fn()`. Same component, no App
  Router in jsdom. *The seam replaces the mock.*
- **The feed does cross `fetch`**, but the rollback test needs one deterministic *delayed* 500 —
  and the delay is the point, since it's what makes the optimistic window assertable.
  `vi.stubGlobal` does that in three lines.

MSW earns its keep when many endpoints share handlers across suites. At two flows it's
ceremony, so the dep should go. Detail: ADR-011.

## Bonus Questions

**Q: What rendering strategy (SSR, SSG, ISR, CSR) would you use for each page and why?**

> - the axis is data dependency, not auth state — "logged out" ≠ "static"
> - `/feed` — dynamic SSR, streamed; reads the session cookie + `searchParams`, so it can't be prerendered (`app/feed/page.tsx:72`)
> - first page hydrated into the Query cache — not fetched twice; pages 2..n client-fetched (`feed-client.tsx`)
> - `/api/*` — dynamic by necessity (session + request params)
> - `/login`, `/ui-kit` — no data of their own; **should** be SSG, but today they're dynamic
> - why — `app/layout.tsx:107` reads `cookies()` (via `getSession`) to show the TopBar; the root layout wraps every route, so all of them go dynamic
> - fix — move the session read into a nested layout wrapping only `/feed`; then those two prerender at build
> - not ISR — a per-user, mutating feed has no meaningful revalidate window; a stale feed is a bug, not a cache hit
> - not CSR — we want the first page server-rendered, not a spinner
> - could add PPR — prerender the shell (top bar, filter rail), stream the feed
> - caveat — route handlers prerender too: a `GET` ignoring cookies/params gets baked at build and serves stale JSON while looking healthy

**Q: How would you keep the bundle small and avoid unnecessary re-renders as the feature set grows?**

> **Bundle**
> - Server Components by default — pages stay server-side (`app/feed/page.tsx`, `app/ui-kit/page.tsx`, `app/(auth)/login/page.tsx`)
> - `"use client"` only at the leaves — `providers.tsx`, `composer.tsx`, `owner-message-card.tsx`, `load-more.tsx`
> - virtualize long lists — `packages/feed/src/feed.tsx:4,68`; renders the visible window, not 1000 rows
> - know each lib's cost — Query ~13kb (earns it: cache + rollback); react-virtual tiny, and it *cuts* DOM work
> - *next:* `next/dynamic` for `react-day-picker` — heaviest dep (`ui-kit/src/components/calendar.tsx`), only mounted when the date popover opens (`filter/date-time-field.tsx:162`); the popover already defers *rendering*, `next/dynamic` defers the *download*
> - *next:* size budget in CI — fail the build on growth instead of guessing
>
> **Re-renders**
> - the fix is the boundary, not the memo
> - filters in the URL — a filter change re-renders on the **server**, no client cascade (`filter/use-filter-query.ts:76`)
> - state at the leaf — the edit row owns its draft, so typing can't re-render the other 999 (`owner-message-card.tsx:36,37,113`)
> - stable keys by id — virtual rows get reused, not rebuilt (`feed.tsx:75,99`)
> - *next:* React Compiler — not enabled yet, so manual `useCallback` still earns its keep here; reach for memo where the Profiler shows a cost

**Q: What would you check first if users reported the feed felt janky while scrolling? What would be your debugging steps to isolate the performance bottleneck?**

> **Check first**
> - reproduce at the volume that triggers it — 1000+ rows; jank only at scale is O(n) work per frame
> - don't guess — record a scroll in the Performance panel; "janky" has several causes that look identical to a user
>
> **Isolate the bottleneck**
> - the flame chart splits it three ways:
> - long JS tasks → re-rendering per scroll event; classic cause is an `onScroll` that sets state
> - heavy layout/paint, little JS → too many DOM nodes → virtualize (`feed.tsx:68`)
> - forced reflow (purple sawtooth) → reading `offsetHeight` between writes
> - then the React Profiler — *which* rows re-render, and why (context value / new object identity in a provider)
> - check layout shift from avatars/images without fixed dimensions — reads as jank even at 60fps
> - paging trigger must come from the virtualizer — *not* an `IntersectionObserver` sentinel (never rendered, so it can never intersect)
> - fix one thing, re-measure against the same trace
> - prior for an unvirtualized 1000-row feed: node count first, unmemoized row second
