# Dispatch — Message Board

A small Next.js message board built for the SDE Frontend Challenge: mock-authenticated users
post short tagged messages to a shared feed, which can be filtered by tag, user, and date
range — with the active filters reflected in the URL so any filtered view is shareable.

> **Project status: scaffold + design docs.** The requirements, architecture, and decisions
> are written up; the feature code is not built yet. See [_ARCHITECTURE.md](_ARCHITECTURE.md)
> for the plan and [_REQUIREMENTS.md](_REQUIREMENTS.md) .

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
- **Design tokens are measured, not assumed.** Every value came from `getComputedStyle` on the
  reference design. Its prose claims a uniform "3px border, 6px shadow"; the rendered CSS
  actually *scales* both with control size, and shadows appear only at ≥42px. The pixels won.

### A note on Next.js 16

This project targets Next.js 16, which renames `middleware.ts` to **`proxy.ts`** and moves
caching to the **Cache Components** model (`use cache`). Guidance written for Next 13–15 does
not transfer cleanly. The bundled docs at `node_modules/next/dist/docs/` are the reference of
record here.
