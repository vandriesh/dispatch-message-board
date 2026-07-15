# Dispatch — Message Board

A small Next.js message board built for the SDE Frontend Challenge: mock-authenticated users
post short tagged messages to a shared feed, which can be filtered by tag, user, and date
range — with the active filters reflected in the URL so any filtered view is shareable.

> **Project status: design system, login, and the feed read path.** `@dmb/ui-kit` (browse it at
> `/ui-kit`), `@dmb/auth`, and now `@dmb/feed` — the faker-seeded mock store, the
> `GET /api/messages` route handler, and the feed/composer/filter UI at `/feed` — are built.
> Posting, inline edit/delete, and client-side infinite scroll are next. See
> [_ARCHITECTURE.md](_ARCHITECTURE.md) for the decisions and [_REQUIREMENTS.md](_REQUIREMENTS.md)
> for what's done.

## Getting started

Requires **Node.js 20.9+** (Next.js 16 minimum).

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

**None required.** The backend is mocked in-process, so there is nothing to configure — the
app runs from a clean clone with no `.env` file. If a real data source is introduced later,
a `.env.example` will be added alongside it.

### Logging in

There is no sign-up — the accounts are seeded. **The password is the same as the email.**

```
john@dispatch.dev  /  john@dispatch.dev
```

Any seeded account follows that convention. A password that doesn't match its email fails the
login (deliberately — it gives the error state something real to do).

_(The full seed list lands with the login screen and will be listed here.)_

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm test` | Vitest (jsdom) |

## Documentation

| File | Contents |
|------|----------|
| [_ARCHITECTURE.md](_ARCHITECTURE.md) | **Start here.** Application structure, every architecture decision and its reasoning, and next steps. |
| [_REQUIREMENTS.md](_REQUIREMENTS.md) | The challenge brief as trackable requirements, with status and resolved open questions. |
| [_AI_DIALOG.md](_AI_DIALOG.md) | The prompts used to build this project. |

**Reference designs:** https://y8lj2w.csb.app — Login, Feed, and the empty/loading states, at
desktop 1440 and mobile 390.

## Architecture at a glance

Full reasoning and trade-offs live in [_ARCHITECTURE.md](_ARCHITECTURE.md) — this is the index.

- **Mocked backend behind real route handlers**, not a fake array imported into components —
  so the frontend↔backend contract is explicit and swappable.
- **The URL is the single source of truth for filters.** No `useState` mirror of filter
  state, so shareable/bookmarkable views come for free and can't drift out of sync.
- **The auth boundary is real even though auth is mocked.** Next 16's `proxy.ts` handles only
  the optimistic redirect; author-only edit/delete is enforced server-side in the route
  handler, where it can't be bypassed.
- **`LOAD MORE` button as designed, with auto-fetch layered on top**, over cursor pagination
  and a virtualized list for 1000+ entries. The button stays because it's the control keyboard
  and screen-reader users can actually reach; auto-fetch is the enhancement, not the baseline.
- **Optimistic post/edit/delete with rollback** against genuinely failing requests.
- **No global state library** — filters are in the URL and server data stays on the server, so
  a store would duplicate state rather than manage it.
- **Modular by feature, extracted gradually.** Domain code lives in `features/<feature>/`;
  the Next.js router surface stays thin. Types are defined where the data is born, and
  nothing is split until scanning gets hard or a second consumer appears. Rules in
  [CLAUDE.md](CLAUDE.md#architecture).
- **The design system is a package, not a folder** — `@dmb/ui-kit` (`packages/ui-kit`). shadcn
  primitives rethemed to the design's tokens. A package because the module graph then *enforces*
  the boundary: the kit can't import from `features/`, so a primitive can't quietly grow domain
  knowledge. Browse them all at **`/ui-kit`**, which exists to make design drift visible.
- **Feature packages never import `next/*`.** `@dmb/auth` owns the login form and its zod schema;
  the form takes its submit **action as a prop**, so the route (`app/(auth)/login/`) injects the
  real Server Action while a test injects a plain function — same component, no App Router in
  jsdom. That injected seam is what lets the login flow be tested with **RTL** against the real
  component (no MSW, no `fetch` to mock — a Server Action has none). See
  [ADR-011](_ARCHITECTURE.md).
- **Login validates on both sides, against one schema.** The client gate spares the backend
  bad payloads and gives instant feedback; the Server Action re-validates the same `loginSchema`
  because a direct hit never runs the client. One schema, one error-mapping — no drift. See
  [ADR-003](_ARCHITECTURE.md).
- **The signed-in top bar lives in the root layout, gated on the session.** `app/layout.tsx`
  reads the session and renders the bar (brand, avatar, `LOG OUT`, built from `@dmb/ui-kit`)
  only when one exists — so `/login` has no bar. Because a root layout is preserved across
  navigation, the login/logout Server Actions call `revalidatePath("/", "layout")` so the bar
  appears/disappears on the transition rather than a navigation late. On mobile the bar slims
  down and folds the handle + `LOG OUT` into a `Popover` menu behind the avatar. See
  [ADR-012](_ARCHITECTURE.md).
- **The feed is mocked behind a real endpoint, not a fake array.** `@dmb/feed` seeds ~1000 faker
  messages once (fixed seed, pinned to `globalThis` so dev HMR doesn't reshuffle) and serves them
  from `GET /api/messages` with **cursor** pagination and URL-mirrored filters. The store is
  `server-only` behind a `@dmb/feed/server` entry, so faker can never reach the client bundle.
  `/feed` is the container: it server-renders the first filtered page and branches
  loading (`loading.tsx`) / empty / data — filters are the URL, so a filtered view is shareable
  and restores on cold load. See [ADR-013](_ARCHITECTURE.md).
- **Design tokens are measured, not assumed.** Every value came from `getComputedStyle` on the
  reference design. Its prose claims a uniform "3px border, 6px shadow"; the rendered CSS
  actually *scales* both with control size, and shadows appear only at ≥42px. The pixels won.

### A note on Next.js 16

This project targets Next.js 16, which renames `middleware.ts` to **`proxy.ts`** and moves
caching to the **Cache Components** model (`use cache`). Guidance written for Next 13–15 does
not transfer cleanly. The bundled docs at `node_modules/next/dist/docs/` are the reference of
record here.
