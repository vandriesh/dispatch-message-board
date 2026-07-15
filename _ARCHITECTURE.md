# Architecture

> **Status: proposed, not yet built.** At the time of writing, the repo is a fresh
> `create-next-app` scaffold — `app/page.tsx`, `app/layout.tsx`, nothing else. This document
> is the plan and the reasoning behind it, so the decisions are reviewable *before* the code
> exists. Each decision below carries a status; they get updated as code lands, and nothing
> here should be read as "already implemented" unless it says so.

Requirement IDs (F1, B2, …) refer to [_REQUIREMENTS.md](_REQUIREMENTS.md).

## Context

Next.js **16.2.10**, React **19.2.4**, TypeScript, Tailwind **v4**, App Router.

This version matters. Next 16 renamed `middleware.ts` → **`proxy.ts`**, and moved caching to
the **Cache Components** model (`cacheComponents: true` + the `use cache` directive). Guidance
written for Next 13–15 does not transfer cleanly, so the bundled docs in
`node_modules/next/dist/docs/` are the reference of record for this project, not memory or
blog posts.

---

## Application structure

Organization follows the project's own `react-gradual-architecture` skill: **modular by
feature, start in one file, extract when responsibilities blur** — not a pre-built folder
hierarchy with one file per abstraction on day one. The binding rules are written up in
[CLAUDE.md](CLAUDE.md#architecture); the shape they produce:

```
app/                         # Next.js router surface ONLY — thin; wires, doesn't implement
  layout.tsx                 # shell, fonts, providers
  page.tsx                   # → redirect to /feed
  login/page.tsx             # F1 — renders features/auth
  feed/page.tsx              # F4 — resolves searchParams, renders features/messages
  api/
    messages/route.ts        # GET (cursor-paginated, filtered), POST      — B4
    messages/[id]/route.ts   # PATCH, DELETE (author-only)                 — B4
    session/route.ts         # POST login, DELETE logout
  login/page.tsx             # F1 — static; renders the feature form
  login/login-route.tsx      # the ONLY file that knows Next exists: router.push on success
  ui-kit/page.tsx            # gallery of every primitive, for design comparison
proxy.ts                     # optimistic auth redirect only (see ADR-003)
packages/                    # the domain, as workspace packages
  ui-kit/                    # @dmb/ui-kit — design-system primitives (ADR-010)
    src/components/          # shadcn atoms, rethemed to the tokens
    src/index.ts             # the public surface
  auth/                      # @dmb/auth — login form, zod schema, session contract
    src/login-form.tsx       # form + schema + request, one file (no premature splitting)
    src/login-form.test.tsx  # RTL + MSW (ADR-011)
  messages/                  # @dmb/messages — feed, composer, edit/delete  [not built]
test/                        # msw handlers + vitest setup
```

**Features are packages, not folders.** ADR-010 introduced `packages/ui-kit`; `@dmb/auth`
follows the same shape, for the same reason — the module graph enforces the boundary. A feature
package importing `next/*` is now a thing you'd have to do on purpose, and ADR-011 explains why
that matters more than it sounds.

Two structural decisions carry most of the weight:

**The router surface is thin.** `page.tsx` resolves params and renders a feature component;
`route.ts` parses a request and calls a feature service. Domain logic lives in `features/`,
where it's testable without booting a router — which is also what makes the B1 test cheap to
write.

**The Server/Client boundary is drawn at the leaves.** The feed page is a Server Component
that reads `searchParams`; the composer, the inline-edit row, and the `LOAD MORE` control are
the only Client Components. This keeps filter state on the server and off the client bundle —
see Q2.

---

## Decisions

### ADR-001 — Mock the backend *behind real route handlers* — Proposed
The brief says backend concerns may be mocked "in any way", and calls real route handlers a
bonus (B4). Rather than importing a fake array directly into components, the mock data lives
behind `app/api/**/route.ts` handlers that speak HTTP with real status codes, real cursor
pagination, and a real author-ownership check.

**Why:** it forces an explicit frontend↔backend *contract*. Swapping the in-memory store for
a real service becomes a change to one module, not a rewrite of every component. It also
makes B3 (rollback on simulated failure) honest — the failure is a real non-2xx response, not
a `setTimeout` pretending.

**Cost:** more code than a fake array. Accepted — it's the bonus the brief explicitly asks for.

### ADR-002 — The URL is the single source of truth for filters — Proposed
F13 requires filters to be shareable/bookmarkable. So `?tag=&user=&from=&to=` in
`searchParams` **is** the filter state. There is no parallel `useState` mirror of it.

**Why:** one source of truth removes the entire class of bugs where the URL and the UI
disagree (back button, refresh, paste-a-link). It also means the Server Component can do the
filtering during render, so the first paint is already filtered — no client round-trip.

**Consequence:** filter controls are links/`router.replace` calls, not local state. Date &
time is a **range** (`from`/`to`) — a single instant isn't a useful filter (O3).

### ADR-003 — Auth: cookie session; `proxy.ts` for redirects only — Proposed
Login (F1) is a real credential form — the design shows `EMAIL` and `PASSWORD` fields, not a
user picker. Seeded accounts use the convention **password == email** (e.g.
`john@dispatch.dev` / `john@dispatch.dev`); a mismatch fails the login, which gives the error
state something real to render. Success sets an `httpOnly` session cookie. No sign-up, per the
brief. The credential hint lives in the README — without it, a reviewer cannot get in.

The Next 16 docs are explicit that Proxy "should not be used as a full session management or
authorization solution", only for *optimistic* checks. So: `proxy.ts` does the cheap
"no cookie → bounce to /login" redirect for UX, and **the authorization that actually
matters — only the author may edit/delete (F8, F9) — is enforced in the route handler**,
against the session, server-side.

**Why:** a client-side-only ownership check is decoration; anyone can POST directly. Even
with a mocked backend, the *shape* of the trust boundary should be the real one, because
that's the part a reviewer is actually reading for.

**Validation runs on both sides, through one function.** Both the **client gate** inside
`LoginForm` and the **Server Action** (`app/(auth)/login/actions.ts`) call the *same*
`parseLogin(formData)` from `@dmb/auth` — it runs `loginSchema` and shapes the errors, and it is
the only place that does either. The client gate rejects a malformed submit in the browser before
it costs a round-trip; the Server Action re-runs `parseLogin` regardless. The two are not
redundant — they answer different threats. The client check spares the backend obviously-bad
payloads and gives instant feedback; the server check is the boundary that actually holds, because
a direct `curl` never runs the client. Because both sides are literally the same function rather
than two copies of a schema, a rule added in one place cannot silently disagree with the other —
the classic failure mode of two-sided validation is two drifting copies, and there are none here.

### ADR-004 — `LOAD MORE` button + auto-fetch, over a virtualized cursor-paginated list — Accepted
F10 allows either pagination or infinite scroll, so the **design breaks the tie**: the feed
mockup ends in an explicit `LOAD MORE ↓` button, and N1 says design precision is assessed.
The button ships as designed.

Auto-fetch-on-approach rides on top of it, and the list is virtualized with
`@tanstack/react-virtual` so 1000+ rows stay smooth (B2).

**The button is not dead UI.** It is the focusable, announceable control that keyboard and
screen-reader users can actually reach — auto-fetch on scroll is invisible to both — and it's
the recovery path when a fetch fails. Auto-fetch is the progressive enhancement; the button is
the baseline. That ordering is the whole justification for shipping both.

**Cursor**, not offset — offset pagination double-serves or skips rows when items are inserted
mid-list, which is exactly what the composer (F2) does.

**Implementation note that bites people:** once the list is virtualized, the classic
`IntersectionObserver` sentinel at the bottom **does not work** — the virtualizer never
rendered it, so it can never intersect. The next page is triggered off the virtualizer
instead: when the last item in `getVirtualItems()` reaches the end of the flattened array,
fetch. Messages are ≤240 chars and wrap to different heights, so rows need dynamic
measurement (`measureElement`), not a fixed `estimateSize`.

**Trade-off:** shipping both paths means two ways to advance the cursor, and they must not
double-fetch. `useInfiniteQuery` dedupes in-flight requests, which is a large part of why
ADR-006 takes it (below).

### ADR-005 — Optimistic UI with real rollback — Proposed
Post/edit/delete (B3) apply immediately against a local overlay, then reconcile with the
server response; a non-2xx rolls the item back and surfaces the failure. The mock API exposes
a way to force failures so the rollback path is demonstrable rather than theoretical.

**Why it's non-trivial:** the rollback has to survive a list that may have re-sorted or
re-filtered underneath it. Optimistic entries therefore carry a client-side temp id until the
server assigns a real one.

### ADR-006 — No global state library; TanStack Query for server cache — Accepted
**No Redux, no Zustand.** Filters live in the URL (ADR-002); the only genuinely client-side
state is "is this row being edited" and the optimistic overlay — both local, both belonging at
the leaf. A global store here would be state *duplication*, not state *management*. That is
the tool deliberately **not** used, per the brief's invitation to justify omissions.

**TanStack Query is taken**, and it is not a contradiction: it's a *server-cache* library, not
a state container. Three things earn it here, all of which we'd otherwise hand-roll worse:

- `useInfiniteQuery` is the exact shape of cursor pagination, and it **dedupes in-flight
  requests** — which is what stops ADR-004's two trigger paths (button + auto-fetch) from
  double-fetching the same cursor.
- `onMutate` / `onError` rollback is precisely B3 (optimistic post/edit/delete with rollback).
- Refetch-on-filter-change falls out of the query key, so a filter change can't leave stale
  pages on screen.

**Cost:** ~13kb gzipped, a `QueryClientProvider` client boundary, and the server-rendered first
page must be **hydrated** into the cache rather than fetched twice. Accepted — the alternative
is reimplementing dedup, retry, and rollback by hand.

Pairs with **`@tanstack/react-virtual`** for the DOM side (ADR-004). Separate package, separate
job: Query owns the data, Virtual owns the rows.

### ADR-007 — Styling: Tailwind v4 + tokens *measured* from the design — Accepted
Tailwind v4 is kept from the scaffold. Tokens are defined in `app/globals.css` under `@theme`,
so no component hardcodes `#FFE600` or a pixel offset.

**The tokens were measured with `getComputedStyle`, not read off the design's prose.** That
distinction turned out to matter. The reference page's own intro paragraph claims a uniform
*"3px border, 6px/6px shadow"*. The rendered CSS does not do that — border width and shadow
offset both **scale with the size of the control**:

| Token | Value | Notes |
|-------|-------|-------|
| Ink | `#111111` | borders, shadows, text |
| Page | `#E4E4DE` | app background |
| Surface | `#FFFFFF` | cards, inputs |
| Accent | `#FFE600` | the single accent |
| Muted text | `#57574F` | timestamps, secondary |
| Radius | `0` | everywhere, no exceptions |
| Border | `2px` → `2.5px` → `3px` | grows with control size |
| Shadow | `2/3/4/5/6px` solid offset, no blur | grows with control size |
| Type | Space Grotesk (prose), Space Mono (controls) | the scaffold's Geist is replaced |

Two rules fell out of the measurements that are easy to "tidy up" into being wrong:

1. **Shadows only appear on controls ≥42px tall.** EDIT, DELETE, and LOG OUT are flat. Giving
   them a shadow would look more consistent and would not match the design.
2. **Border width tracks height** — 2px at 34px, 2.5px at 40px, 3px at 42px and up.

Encoded as a `shadow-brutal-{xs,sm,md,lg,xl}` scale plus a `press-brutal` utility (the control
translates onto its own shadow on `:active`). A zero-radius, zero-blur system is unforgiving:
one stray `rounded` reads instantly as a miss, and N1 is explicitly graded.

**How the primitives get this look:** see ADR-009 and ADR-010.

### ADR-009 — shadcn, themed into the brutalist system — Accepted
Primitives (Button, Input, Select, Popover, Calendar) come from **shadcn**, retheme​d to the
spec rather than used as-is.

**Why this isn't "fighting the defaults":** shadcn is a *generator*, not a dependency. `add`
copies the component source into our repo (`components/ui/` — see the carve-out in
[CLAUDE.md](CLAUDE.md#the-one-exception-componentsui)), so editing it is the intended workflow,
not a workaround. We own the markup and the classes.

What we get for free, and what we write:

- **Free:** `--radius: 0` kills every rounded corner in one line — the single highest-leverage
  token for this design. Colors map straight onto the existing variables (`--primary` →
  `#FFE600`, `--border`/`--foreground` → `#111`).
- **Written by us:** shadcn has **no tokens for shadow or border-width**, and this system is
  defined by them (`6px 6px 0 #111`, `3px` solid). So a `shadow-brutal` utility goes into
  `@theme`, and the copied `button.tsx` / `input.tsx` are edited to use it. Perhaps ten
  minutes of work across the few components we need — but it is the part that's easy to
  underestimate when someone says "just theme it."

**What the primitive layer underneath actually buys** — the accessibility that is genuinely
painful to hand-roll: focus traps, keyboard navigation in the select, roving focus in the
calendar grid, `aria-*` wiring on the popover. That is the real argument for shadcn over
hand-rolled markup, not the styling.

**Correction: it is Base UI, not Radix.** An earlier draft of this ADR said Radix. shadcn's
current default (`style: base-nova`) installs **`@base-ui/react`** — the Radix team's
successor library — and the CLI ships a `migrate-radix-to-base` skill for projects moving over.
The practical difference for us: custom triggers use the **`render` prop, not `asChild`**.
Anything written against Radix's API needs translating.

**Both install-time risks are now resolved:**
- ✅ `shadcn init` runs cleanly against **Tailwind v4 + Next 16** — it detected both, wrote
  `@theme`-based tokens, and needed no `tailwind.config.ts`. This was the risk worth retiring
  first, and it cost nothing.
- ⚠️ The date-range Calendar (O3) does pull in `react-day-picker` **and `date-fns`** — still by
  far the heaviest thing in the set, and still the prime `next/dynamic` candidate (Q2). The
  primitive is installed; whether the *feed* uses it or falls back to two plain `From`/`To`
  inputs is a decision deferred to when that screen is real.

### ADR-010 — The ui-kit is a workspace package, not a folder — Accepted
Primitives live in `packages/ui-kit` (an npm workspace, `@dmb/ui-kit`) rather than in a
`components/ui/` folder inside the app.

**Why a package.** The boundary between "design system" and "domain" is then enforced by the
**module graph**, not by discipline: `@dmb/ui-kit` has no dependency on `features/`, so a
primitive *cannot* quietly grow domain knowledge. In a plain folder, nothing stops someone
importing a `Message` type into `Badge`, and by the time anyone notices, the "design system" is
just a components folder with extra steps. Making the wrong thing impossible beats documenting
that it's discouraged.

It also makes the kit independently reviewable — and `/ui-kit`, the gallery route, exists so
the primitives can be diffed against the reference design in a browser rather than by eye.

**Mechanics.** No build step: the package ships TypeScript source and Next compiles it via
`transpilePackages: ["@dmb/ui-kit"]`. Path aliases in `tsconfig.json` resolve `@dmb/ui-kit` to
`src/index.ts`. The package has **its own `components.json`**, so `shadcn add` must be run from
`packages/ui-kit/` — the CLI detects the workspace and refuses to write from the repo root.
Tailwind must be told to scan outside `app/`, hence `@source "../packages/ui-kit/src"` in
`globals.css`; without it, classes used *only* in the package are silently not generated.

**Cost.** A workspace is more setup than a folder, and `npm install` now has to link it. Cheap,
and paid once.

### ADR-011 — Testing: RTL against a real component, seamed by an injected action — Accepted
Tests drive the **real** `LoginForm` with React Testing Library — no mocked router, no shallow
rendering, no network. There is also **no MSW**, and that is a direct consequence of login being
a **Server Action** (see the auth refactor): Server Actions are a Next-internal POST protocol
with an encoded action id, so there is no `fetch` for MSW to intercept and nothing at the network
layer to mock. The seam moved from the network to the **action itself**.

**The load-bearing constraint is unchanged:** a feature package must not import from `next/*`.
The moment `LoginForm` reaches for `redirect` or a Server Action module, it drags Next into jsdom.
So the form takes the **action as a prop** (`action: LoginAction`) and has no opinion about what
login *does*. The route (`app/(auth)/login/page.tsx`) injects the real Server Action; a test
injects a plain async function. Same component, same schema, same `useActionState` wiring — only
the far end of the seam differs.

This makes the interesting logic testable as what it actually is:

- **`verifyCredentials`** is a pure function, so it's unit-tested directly — no render at all.
- **Client-side validation** is the form's own gate, so the test passes a *non-validating* fake
  action and asserts it is **never called** for a bad payload (`vi.fn(...).not.toHaveBeenCalled()`).
  That is the framework-free equivalent of the old "request was never made" assertion, and it
  encodes the two-sided-validation intent (ADR-003) as a test: the backend is spared.
- **Success / wrong-credentials** run through the real form against a fake action that stands in
  for the server's business logic; the test swaps in its own "protected view" where the real app
  would `redirect`.

The one thing this *cannot* cover is the Next-specific glue — the cookie write and the redirect
in the Server Action. That belongs to an E2E test (Playwright is available), not to jsdom;
faking it in a unit test would only assert that the fake was called. The root `test/setup.ts`
stays generic (jsdom matchers + cleanup only).

Satisfies **B1**. The highest-value test is still the optimistic-rollback path (B3) once
mutations exist; the same injected-seam approach covers it.

### ADR-008 — Feature-modular organization, gradually extracted — Accepted
Code is organized **by feature, not by file type**, following the project's
`react-gradual-architecture` skill. Full rules in [CLAUDE.md](CLAUDE.md#architecture);
the load-bearing ones:

- Framework-shaped code (`page.tsx`, `route.ts`, `proxy.ts`) follows Next.js naming and
  placement exactly. Domain code — the components that describe the domain, and the services
  — lives in `features/<feature>/` and stays framework-agnostic where it reasonably can.
- **Types are defined where the data is born.** No `types.ts` files.
- **No premature splitting:** if it fits in ~200 lines, it stays in one file. Extract when
  scanning gets hard, when concerns diverge, or on the *second* use — never before.

**Why:** the alternative — a `components/` + `hooks/` + `utils/` + `types/` hierarchy scaffolded
on day one — spreads a single feature across four folders before anyone knows what the feature
is. Feature-modularity keeps a change to the composer inside one directory, and the "extract
on the second use" rule means shared code is discovered rather than guessed at.

**Cost:** requires judgment rather than a rule a linter can enforce, so it needs to be
restated in review. That's why it's in `CLAUDE.md` and not just here.

---

## Bonus questions

### Q1 — Rendering strategy per page

**The axis is data dependency, not auth state.** A route is static when its output doesn't
depend on the request, and dynamic when it does. Being logged in is the most common *reason*
output varies — it is not itself the criterion. Keeping those separate is what stops "the
logged-out page" and "the static page" from being treated as synonyms.

| Route | Strategy | Why |
|-------|----------|-----|
| `/login` | **Static** — prerendered at build | Its markup is identical for every visitor; there is no session yet, by definition. Served as a static asset. It still *contains* a Client Component (the form, holding email/password/error state) which hydrates and posts to a live endpoint — a static page triggering a dynamic mutation is the ordinary case, not an exception. |
| `/feed` | **Dynamic SSR**, streamed | Reads the session cookie *and* the filter `searchParams` — both runtime data — so it cannot be prerendered. Server-renders the first filtered page so the user sees content, not a spinner. |
| Feed rows | **Server Components** | Never reach the client bundle. Only the leaves hydrate: composer, inline-edit row, `LOAD MORE`. |
| Pages 2..n | **Client-fetched** | Fetched on demand via `useInfiniteQuery` (ADR-004). The server-rendered first page is **hydrated into the Query cache** rather than fetched a second time (ADR-006). |
| `GET /api/messages` | **Dynamic** | Reads the session cookie and filter params. Dynamic *by necessity*, not by decree. |
| `POST`/`PATCH`/`DELETE /api/*` | **Dynamic** | Vacuously — mutations are never prerendered. |
| *(a `GET /api/tags`, if added)* | **Static** — prerendered | Four constants, no runtime data. Next would prerender it, and that is the **correct** outcome, not a bug. |

**Why the `/api` rows are worth stating at all.** Route handlers don't render UI, but they
still participate in the prerender model: the Next 16 docs say `GET` handlers "can be
prerendered when they don't access uncached or runtime data"
(`node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md:89`). For a
handler, "prerendered" means *executed at build and its response body served as a static
asset*. So a `GET /api/messages` that read the store without touching cookies or params would
be baked at build time — the feed endpoint would serve a frozen JSON file from whenever CI
last ran, looking healthy while silently returning stale data. Ours reads request data, so
this can't happen; the point is that it's a real hazard, not a category error.

**Keeping `/login` static has one trap.** Bouncing an already-authenticated visitor to `/feed`
by calling `cookies()` in `login/page.tsx` reads runtime data and makes the page dynamic —
trading a free static asset for a per-request render to handle a rare case. That redirect
belongs in `proxy.ts`, which already does the inverse check, and which the Next docs describe
as the legitimate home for exactly this kind of optimistic cookie-presence check (ADR-003).

**Not ISR/SSG for the feed:** a feed that's per-user-filtered and mutated in real time has no
meaningful "revalidate window" — a stale cached feed is a bug, not an optimization. If the
feed later became public and unfiltered, ISR over a shared first page would be the obvious
win, with `use cache` + a tag revalidated on POST.

### Q2 — Keeping the bundle small and avoiding re-renders as features grow

**Bundle:**
- Server Components by default; `"use client"` pushed to the leaves. The composer needs
  interactivity — the feed *shell* does not, and the difference compounds.
- Know what the client bundle actually costs. The three deliberate additions are TanStack
  Query (~13kb gzipped, justified in ADR-006), `@tanstack/react-virtual` (small, and it
  *reduces* DOM cost), and `react-day-picker` behind the shadcn Calendar — by far the heaviest,
  and the one most likely not to earn its weight (ADR-009).
- `react-day-picker` is the prime `next/dynamic` candidate: the date filter is collapsed behind
  a popover on desktop and a `⚙` drawer on mobile, so it should never be in the critical path
  of first paint.
- Watch it, don't guess: `@next/bundle-analyzer` in CI, with a size budget that fails the
  build on regression. "Keep the bundle small" is a process, not a one-time cleanup.

**Re-renders:**
- The structural fix is the boundary, not the memo. Filter state in the URL means a filter
  change re-renders on the *server*; it doesn't cascade through a client tree.
- Colocate state at the leaf — an inline-edit row owning its own draft state means typing in
  it cannot re-render the other 999 rows. This is the single highest-leverage rule here.
- Rows are stable, keyed by message id, so a virtualized list can reuse them.
- React Compiler (React 19) covers most of what hand-written `memo`/`useCallback` used to;
  reach for manual memoization only where the profiler shows a cost, not preemptively.

### Q3 — "The feed feels janky while scrolling" — first checks

Measure before touching code; jank has several distinct causes that look identical to a user.

1. **Reproduce with the data volume that triggers it** — 1000+ entries (B2). Jank that only
   appears at scale is usually O(n) work per frame.
2. **Performance panel, record a scroll.** The flame chart immediately separates the three
   candidates:
   - **Long JS tasks** → re-rendering the whole list per scroll event. Check whether an
     `onScroll` handler sets state — the classic mistake, since it turns every scroll frame
     into a React render. Fix: don't drive paging from scroll events. In a *virtualized* list
     the trigger comes from the virtualizer itself (the last item in `getVirtualItems()`
     reaching the end of the data), **not** from an `IntersectionObserver` sentinel — the
     sentinel is never rendered, so it can never intersect (ADR-004). IO is the right answer
     only for a non-virtualized list.
   - **Huge layout/paint, little JS** → too many DOM nodes; the browser, not React, is the
     bottleneck. Fix: virtualization (B2).
   - **Layout thrash / forced reflow** (the tell-tale purple sawtooth) → reading a layout
     property like `offsetHeight` in a loop between writes.
3. **React Profiler** to confirm *which* components re-render and why — specifically whether
   a context value or a new object identity in a provider is re-rendering every row.
4. **Check for layout shift from images/avatars** without fixed dimensions — perceived as
   jank even when the frame rate is fine.

Only then fix, and re-measure against the same trace. My prior, given a 1000-row feed with no
virtualization: it's DOM node count first, an unmemoized row second.

---

## Next steps

**Testing (B1).** Vitest + React Testing Library. The highest-value single test isn't a
render snapshot — it's the **optimistic-rollback path** (B3): post a message against a forced
failure and assert the row disappears and the error surfaces. That's the logic most likely to
break silently. Add a filter→URL round-trip test (F13), and Playwright for one end-to-end
happy path if time allowed.

**CI/CD.** GitHub Actions on PR: typecheck, lint, test, `next build`, bundle-size budget.
Cheap to add, and it's what makes the size budget in Q2 real rather than aspirational.

**Deployment.** Vercel — the platform matches the framework's rendering model with no
configuration, and preview deployments per PR make design review (N1) concrete. The
in-memory mock store is not deploy-safe across serverless invocations; a real deployment
needs the store swapped for something durable, which ADR-001 is designed to make a one-module
change.

**Design reference.** https://y8lj2w.csb.app — Login, Feed (default), Feed (empty + loading),
each at desktop 1440 and mobile 390. No longer a gap; O1 is closed and N1 is unblocked. The
spec also pins down details the PDF left open: relative timestamps (`2m`, `18m`, `1h`),
`EDIT`/`DELETE` rendered only on your own messages, a `0/240` live character counter in the
composer, and the empty-state copy ("Nothing here yet — No messages match this view. Post the
first one, or clear your filters.").
