# Requirements — SDE Challenge (Frontend)

Source: `fe-challenge.pdf` (SDE Challenge – Frontend). This file restates the brief as
trackable requirements. Where the PDF leaves something open, that is recorded explicitly as
an **open question** rather than silently assumed.

## Framing

> "This is not a test of perfection. We want to see how you think, how you structure your
> work, and how you approach solving problems."

The brief stresses that there is no single correct answer; what is assessed is thought
process, trade-offs, and technical leadership mindset. Expected effort: a few hours.
Deliberate scoping decisions are in scope — untouched tools should still be justified.

---

## Functional requirements

| ID | Requirement | Status |
|----|-------------|--------|
| F1 | Users can log in. Users are mocked/pre-created — **no sign-up flow**. | Form + validation done (`@dmb/auth`); session-gated top bar + `LOG OUT` in the root layout land the login→feed→logout loop (ADR-012); login is a Server Action against `verifyCredentials` |
| F2 | Authenticated users can post short messages, **max 240 characters**. | Done — `Composer` posts via `POST /api/messages` with an optimistic insert + rollback (ADR-005); 240 guard on both the composer and the route's zod schema |
| F3 | A message carries a **tag** (category), assigned at post time. | Done — single-select in the composer; the tag rides the `POST` body and is enforced by the schema |
| F4 | All messages are visible on a Message Page (the feed). | Done — `/feed` server-renders the first page from `@dmb/feed` (ADR-013) |
| F5 | Feed can be filtered by **tag**. | Done — endpoint + URL-driven multi-select toggle |
| F6 | Feed can be filtered by **date & time**. | Date **range** done (`from`/`to`, inclusive). Time-of-day not exposed — see O3 |
| F7 | Feed can be filtered by **user**. | Done — endpoint + URL-driven owner dropdown (single-select, "All users" clears; per the design) |
| F8 | Only the **author** can inline-edit their own message. | Done — `OwnerMessageCard`'s inline `EditCard` (body-only) via `PATCH /api/messages/[id]`, optimistic + rollback; the `owner` flag (rbac) shows EDIT only on your own rows, author re-checked in the store (403 otherwise) |
| F9 | Only the **author** can delete their own message. | Done — two-step delete confirm → optimistic `DELETE /api/messages/[id]`; `owner`-gated affordance, author enforced server-side |
| F10 | Feed supports **pagination or infinite scroll** (either is acceptable). | `LOAD MORE` now drives `useInfiniteQuery.fetchNextPage` (ADR-005/006); cursor endpoint unchanged. Auto-fetch-on-scroll + virtualization still pending |
| F11 | Feed has **loading** and **empty** states. | Done — `app/feed/loading.tsx` (streaming) + `<FeedEmpty>`; the skeleton is now actually visible because the SSR fetch awaits a mock latency (ADR-005) |
| F12 | Layout is **responsive** (mobile + desktop). | Desktop 2-col grid done (measured: 296px rail + feed, 1120 max, gap/padding 32). Mobile stacks to one column, no overflow; the design's `⚙` filter drawer is a later polish |
| F13 | Active filters (tag/date/user) are **reflected in the URL**, so filtered views are shareable/bookmarkable. | Done — filters are the URL (ADR-002); verified cold-load hydration |

## Non-functional requirements

| ID | Requirement | Status |
|----|-------------|--------|
| N1 | Design specs implemented **precisely** — assessed explicitly. Reference designs: **https://y8lj2w.csb.app** (desktop 1440 + mobile 390, per page). Tokens measured, not taken from its prose — see ADR-007. | Unblocked; kit built (`/ui-kit`) |
| N2 | Modular, well-structured code. | Ongoing |
| N3 | Backend is **mocked** — user creation, feed data, etc. Frontend skills are what's assessed. | Feed mocked behind a real route handler (`@dmb/feed` + `GET /api/messages`, ADR-012); session still MSW-only pending its route |
| N4 | Beyond React and Next.js, **no prescribed tools**. Library choices are an opportunity to show preference + rationale. | Ongoing |
| N5 | Edge cases and missing details are ours to decide — handling ambiguity is part of the assessment. | Ongoing |

## Required deliverables

| ID | Deliverable | Status |
|----|-------------|--------|
| D1 | `README.md` with setup instructions to run the app locally. | Done (will evolve) |
| D2 | `.env.example`, **if required** — so the app runs without surprises. | N/A so far — no env vars needed while the backend is mocked. Revisit if that changes. |
| D3 | Short explanation in `_ARCHITECTURE.md` *or* `README.md` covering: application structure and reasoning; decisions made (filtering, pagination, auth); suggestions for next steps (testing, CI/CD, deployment). | In progress — `_ARCHITECTURE.md` |
| D4 | Submission: zip the project folder, reply to the email. Everything included, minimal setup to run. | Not started |

## Bonus points

| ID | Item | Status |
|----|------|--------|
| B1 | At least one test (e.g. a component or hook test). | Done — login flow (RTL + MSW v2, ADR-011) **and** the optimistic post rollback (`feed-mutations.test.tsx`: row appears → rolls back → error surfaces) |
| B2 | List virtualization for the feed — smooth interaction at **1000+ entries**. | Not started |
| B3 | Optimistic UI for post/edit/delete, **with rollback on simulated failure**. | Done — TanStack Query `onMutate`/`onError` (ADR-005). `fail` forces a write failure, `keep` forces a delete failure; both roll back with an inline error |
| B4 | Actual **route handlers** for mocked data/requests — shows how contracts with backend are established. Called out in the brief as a bonus. | Done for the feed — `GET /api/messages` with cursor pagination + filters (ADR-012) |

## Bonus questions (to answer in writing)

| ID | Question | Status |
|----|----------|--------|
| Q1 | What rendering strategy (SSR, SSG, ISR, CSR) for each page, and why? | Answered in `_ARCHITECTURE.md` |
| Q2 | How to keep the bundle small and avoid unnecessary re-renders as the feature set grows? | Answered in `_ARCHITECTURE.md` |
| Q3 | What would you check first if users reported the feed felt janky while scrolling? Debugging steps to isolate the bottleneck? | Answered in `_ARCHITECTURE.md` |

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
  rail shows three chips plus a `⚙` overflow — the fourth tag needs a "more" affordance.
- **O3 — Date filter shape.** ✅ **Resolved: a range.** The design shows two fields under
  `DATE` — `From` and `To` — so this is not a single-date filter. Displayed as `dd-mm-yyyy`
  via a shadcn datepicker; **carried in the URL as ISO `yyyy-mm-dd`**, which sorts, parses
  unambiguously, and keeps shared links readable across locales.
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
