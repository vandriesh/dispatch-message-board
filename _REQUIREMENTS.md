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
| F1 | Users can log in. Users are mocked/pre-created — **no sign-up flow**. | Not started |
| F2 | Authenticated users can post short messages, **max 240 characters**. | Not started |
| F3 | A message carries a **tag** (category), assigned at post time. | Not started |
| F4 | All messages are visible on a Message Page (the feed). | Not started |
| F5 | Feed can be filtered by **tag**. | Not started |
| F6 | Feed can be filtered by **date & time**. | Not started |
| F7 | Feed can be filtered by **user**. | Not started |
| F8 | Only the **author** can inline-edit their own message. | Not started |
| F9 | Only the **author** can delete their own message. | Not started |
| F10 | Feed supports **pagination or infinite scroll** (either is acceptable). | Not started |
| F11 | Feed has **loading** and **empty** states. | Not started |
| F12 | Layout is **responsive** (mobile + desktop). | Not started |
| F13 | Active filters (tag/date/user) are **reflected in the URL**, so filtered views are shareable/bookmarkable. | Not started |

## Non-functional requirements

| ID | Requirement | Status |
|----|-------------|--------|
| N1 | Design specs implemented **precisely** — assessed explicitly. Reference designs: **https://y8lj2w.csb.app** (desktop 1440 + mobile 390, per page). Tokens: 3px borders, 6px/6px solid `#111` offset shadows, 0 radius, accent `#FFE600`. | Unblocked — see O1 |
| N2 | Modular, well-structured code. | Ongoing |
| N3 | Backend is **mocked** — user creation, feed data, etc. Frontend skills are what's assessed. | Not started |
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
| B1 | At least one test (e.g. a component or hook test). | Not started |
| B2 | List virtualization for the feed — smooth interaction at **1000+ entries**. | Not started |
| B3 | Optimistic UI for post/edit/delete, **with rollback on simulated failure**. | Not started |
| B4 | Actual **route handlers** for mocked data/requests — shows how contracts with backend are established. Called out in the brief as a bonus. | Not started |

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
  each at desktop 1440 and mobile 390. The spec states its own tokens: **3px borders,
  6px/6px solid `#111` offset shadows, 0 corner radius, single accent `#FFE600`**. N1 is
  unblocked.
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
