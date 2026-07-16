# Requirements — SDE Challenge (Frontend)

Source: `fe-challenge.pdf` (SDE Challenge – Frontend). This file restates the brief as a
trackable **acceptance checklist**. Where the PDF leaves something open, that is recorded
explicitly as an **open question** rather than silently assumed.

**Legend:** ✅ done · 🟡 partial / deliberately narrowed · ⬜ not started · ➖ not applicable

**At a glance:** 12/13 functional ✅ (1 🟡) · 5/5 non-functional ✅ · 4/4 bonus points ✅ ·
3/3 bonus questions ✅ · deliverables 2 ✅, 1 ➖, 1 ⬜ (submission zip).

## Framing

> "This is not a test of perfection. We want to see how you think, how you structure your
> work, and how you approach solving problems."

The brief stresses that there is no single correct answer; what is assessed is thought
process, trade-offs, and technical leadership mindset. Expected effort: a few hours.
Deliberate scoping decisions are in scope — untouched tools should still be justified.

---

## Functional requirements

| ID | ✓ | Requirement | Notes |
|----|---|-------------|-------|
| F1 | ✅ | Users can log in. Users are mocked/pre-created — **no sign-up flow**. | Login is a Server Action against `verifyCredentials` with two-sided validation (`@dmb/auth`); cookie session, and a session-gated top bar + `LOG OUT` in the root layout close the login→feed→logout loop (ADR-003/012) |
| F2 | ✅ | Authenticated users can post short messages, **max 240 characters**. | `Composer` posts via `POST /api/messages` with an optimistic insert + rollback (ADR-005); the 240 cap is enforced on both the composer and the route's zod schema |
| F3 | ✅ | A message carries a **tag** (category), assigned at post time. | Single-select in the composer; the tag rides the `POST` body and is enforced by the schema. One tag per message (O2) |
| F4 | ✅ | All messages are visible on a Message Page (the feed). | `/feed` server-renders the first page from `@dmb/feed`, so the first paint is already filtered (ADR-013) |
| F5 | ✅ | Feed can be filtered by **tag**. | Endpoint + URL-driven chips, single-select (radio) on both rails; clicking the active chip clears it. Below `lg` the tags are a newest-first row seeded from the URL tag, with the full set behind the `⚙` panel (O2) |
| F6 | ✅ | Feed can be filtered by **date & time**. | Range of **instants** (`from`/`to`, inclusive), each a date popover beside a time input (O3). The controls read local wall-clock and commit UTC, so the URL carries `from=2026-07-14T21:00:00.000Z` and the bound means the same moment wherever it's opened (ADR-014). Picking only a day still covers the whole day, and a bare `yyyy-mm-dd` is still honoured, so links shared before the range grew a time keep working |
| F7 | ✅ | Feed can be filtered by **user**. | Endpoint + URL-driven owner dropdown (single-select, "All users" clears — per the design) |
| F8 | ✅ | Only the **author** can inline-edit their own message. | `OwnerMessageCard`'s inline `EditCard` (body-only) via `PATCH /api/messages/[id]`, optimistic + rollback; the `owner` flag (rbac) shows EDIT only on your own rows, and the author is re-checked in the store (403 otherwise) |
| F9 | ✅ | Only the **author** can delete their own message. | Two-step delete confirm → optimistic `DELETE /api/messages/[id]`; `owner`-gated affordance, author enforced server-side |
| F10 | ✅ | Feed supports **pagination or infinite scroll** (either is acceptable). | Both (O5) — `LOAD MORE` drives `useInfiniteQuery.fetchNextPage`, and auto-fetch-on-scroll rides the virtualizer's last item (ADR-004). `LOAD ALL` pulls every remaining row in one request to demo the virtual list. A right-aligned `loaded/total pages` readout sits under the list |
| F11 | ✅ | Feed has **loading** and **empty** states. | `app/feed/loading.tsx` (streaming Suspense fallback) + `<FeedEmpty>`; the skeleton is actually visible because the SSR fetch awaits a mock latency (ADR-005) |
| F12 | ✅ | Layout is **responsive** (mobile + desktop). | Desktop is a measured 2-col grid (296px rail + feed, 1120 max, gap/padding 32); below `lg` it collapses to one column and the rail becomes the `⚙` cog panel + tag row pinned under the composer. The app shell bounds `main` to the viewport so only the feed scrolls |
| F13 | ✅ | Active filters (tag/date/user) are **reflected in the URL**, so filtered views are shareable/bookmarkable. | Filters *are* the URL (ADR-002); cold-load hydration verified. The active tag is optimistically mirrored so a tap lights up instantly (with a pending spinner) and then reconciles from the URL |

## Non-functional requirements

| ID | ✓ | Requirement | Notes |
|----|---|-------------|-------|
| N1 | ✅ | Design specs implemented **precisely** — assessed explicitly. Reference designs: **https://y8lj2w.csb.app** (desktop 1440 + mobile 390, per page). | Tokens **measured** with `getComputedStyle`, not taken from the reference's prose — which misstates its own borders/shadows (O1, ADR-007). `@dmb/ui-kit` holds the primitives; Login, Feed default, and Feed empty/loading are built at both breakpoints |
| N2 | ✅ | Modular, well-structured code. | Feature-modular, not type-named buckets: features/packages own their code, and `@dmb/ui-kit` is a **workspace package** so the boundary is enforced by the module graph rather than discipline (ADR-008/010) |
| N3 | ✅ | Backend is **mocked** — user creation, feed data, etc. Frontend skills are what's assessed. | Feed mocked behind **real route handlers** (`@dmb/feed` + `/api/messages`, ADR-001/013); auth mocked via a Server Action + cookie session (ADR-003). `import "server-only"` + a separate entry keep the faker store out of client bundles |
| N4 | ✅ | Beyond React and Next.js, **no prescribed tools**. Library choices are an opportunity to show preference + rationale. | Every library choice — and every deliberate omission — is an ADR in `_ARCHITECTURE.md` |
| N5 | ✅ | Edge cases and missing details are ours to decide — handling ambiguity is part of the assessment. | Recorded as open questions **O1–O5** below rather than silently assumed; all five resolved against the design |

## Required deliverables

| ID | ✓ | Deliverable | Notes |
|----|---|-------------|-------|
| D1 | ✅ | `README.md` with setup instructions to run the app locally. | Present, incl. the seeded-account hint (password == email) — without it a reviewer cannot log in (O4) |
| D2 | ➖ | `.env.example`, **if required** — so the app runs without surprises. | Not required — no env vars while the backend is mocked. Revisit if that changes |
| D3 | ✅ | Short explanation in `_ARCHITECTURE.md` *or* `README.md` covering: application structure and reasoning; decisions made (filtering, pagination, auth); suggestions for next steps (testing, CI/CD, deployment). | `_ARCHITECTURE.md` covers all three: structure + reasoning, ADRs for filtering (002)/pagination (004)/auth (003), and a **Next steps** section with testing, CI/CD (GH Actions: typecheck, lint, test, build, bundle budget) and deployment (Vercel) |
| D4 | ⬜ | Submission: zip the project folder, reply to the email. Everything included, minimal setup to run. | Not started |

## Bonus points

| ID | ✓ | Item | Notes |
|----|---|------|-------|
| B1 | ✅ | At least one test (e.g. a component or hook test). | Two — the login flow (RTL + MSW v2, ADR-011) **and** the optimistic post rollback (`feed-mutations.test.tsx`: row appears → rolls back → error surfaces). 13 tests green |
| B2 | ✅ | List virtualization for the feed — smooth interaction at **1000+ entries**. | `@tanstack/react-virtual` in `Feed` (ADR-004/006): windowed render (~10–13 DOM rows for 1000), dynamic `measureElement` (rows wrap / grow in edit), overscan, product-owned scroller. `LOAD ALL` fills the list in one request to demo it |
| B3 | ✅ | Optimistic UI for post/edit/delete, **with rollback on simulated failure**. | TanStack Query `onMutate`/`onError` (ADR-005). The magic words: `fail` forces a write failure, `keep` (then delete) forces a delete failure; both roll back with an inline error |
| B4 | ✅ | Actual **route handlers** for mocked data/requests — shows how contracts with backend are established. | `GET`/`POST /api/messages` + `PATCH`/`DELETE /api/messages/[id]` — cursor pagination, repeatable filter params, zod-validated at the boundary, author-enforced, `total` on the read contract (ADR-001). Auth is a Server Action rather than a route, deliberately (ADR-003) |

## Bonus questions (to answer in writing)

| ID | ✓ | Question | Notes |
|----|---|----------|-------|
| Q1 | ✅ | What rendering strategy (SSR, SSG, ISR, CSR) for each page, and why? | Answered in `_ARCHITECTURE.md` |
| Q2 | ✅ | How to keep the bundle small and avoid unnecessary re-renders as the feature set grows? | Answered in `_ARCHITECTURE.md` |
| Q3 | ✅ | What would you check first if users reported the feed felt janky while scrolling? Debugging steps to isolate the bottleneck? | Answered in `_ARCHITECTURE.md` |

---

## Open questions — all resolved

Recorded rather than silently assumed. Each was checked against the design spec (see O1).

- **O1 — Where are the designs?** ✅ **Resolved.** The reference designs are at
  **https://y8lj2w.csb.app** — three sections (Login, Feed default, Feed empty & loading),
  each at desktop 1440 and mobile 390. **Its prose claims a uniform 3px border and 6px/6px
  shadow — the rendered CSS does not do that.** Both scale with control size, and shadows
  appear only at ≥42px. Tokens were measured with `getComputedStyle`; see ADR-007. N1 unblocked.
- **O2 — Tag vocabulary.** ✅ **Resolved, confirmed by the design.** A fixed set of four:
  `PRODUCT`, `DESIGN`, `RANDOM`, `ANNOUNCE`. **One tag per message.** On mobile the filter
  rail shows three chips plus a `⚙` overflow — the fourth tag needs a "more" affordance,
  which is the cog panel.
- **O3 — Date filter shape.** ✅ **Resolved: a range, of instants.** The design shows two
  fields under `DATE` — `From` and `To` — so this is not a single-date filter. Each end is a
  date popover beside a time input, which is how shadcn ships date+time: there is no
  `date-picker` component to install, only `Calendar` and a composition recipe (the time half
  is a native `<input type="time">`).
  **Carried in the URL as an ISO instant**, not the `yyyy-mm-dd` originally planned — once the
  range has a time, a bound has to name a moment rather than a wall-clock reading, or it means
  something different in every timezone (ADR-014).
  Built on shadcn, **themed into** the brutalist system rather than used as-is — shadcn copies
  its source into our repo, so restyling it is the intended workflow, not a fight. See ADR-009.
- **O4 — Auth depth.** ✅ **Resolved, confirmed by the design.** The login screen has real
  `EMAIL` and `PASSWORD` fields ("Use a seeded account to continue"), so this is a credential
  form, not a user picker. **Convention: password == email** (e.g.
  `john@dispatch.dev` / `john@dispatch.dev`); a mismatch fails the login, which gives us a
  real error state to build. **This hint must be in the README** — without it a reviewer
  cannot log in. Session persists in a cookie.
- **O5 — Pagination vs. infinite scroll.** ✅ **Resolved: both.** The design shows an explicit
  **`LOAD MORE ↓`** button, so the button ships as designed (N1). Auto-fetch on approach to
  the end of the list rides on top of it, and the list is virtualized with
  `@tanstack/react-virtual` for B2. The button is not decorative: it is the focusable control
  keyboard and screen-reader users can reach, and the recovery path when a fetch fails. See
  ADR-004.
