# Handoff — Optimistic mobile tag selection + pending animation

## The task (next session)
Make the **mobile** tag filter feel responsive when a tag is picked, matching what
the desktop rail already does:

1. **Optimistic highlight** — the tapped chip should light up (turn accent/yellow)
   *immediately*, not after the ~1.2s `mockLatency` navigation commits.
2. **Pending "loading" indicator** — while the feed reloads, show a pending
   treatment on the active chip (user suggested "three dots"; a small spinner or a
   pulsing "…" is fine). Do **both** — the instant colour change **and** the
   pending indicator on top. Don't let the animation replace the highlight.

User's exact words are in `_AI_DIALOG.md` (last entries). This was requested as
"fix please" but was interrupted before any code was written — **nothing is
started yet.**

Apply the same pending indicator to the **desktop** rail too (it already has the
optimistic highlight, but no loading feedback during the 1.2s).

## Why mobile lags today (root cause)
- `packages/feed/src/filter/feed-filter-mobile.tsx` derives the highlight from the
  server prop: `const selected = value.tag?.[0] ?? null`. `value` flows
  `page.tsx → FeedSection → FeedFilterMobile` and only updates **after** the
  `mockLatency` (~1.2s, ADR-005) navigation commits. So the chip enters the bar
  instantly (via `mobileTags`) but doesn't highlight until the load finishes.
- **Desktop already solved this**: `packages/feed/src/filter/feed-filter-bar.tsx`
  holds `tags` in local state (optimistic), reads the live URL via
  `parseFilterParams(useSearchParams())`, updates on the same click that writes the
  URL, and re-syncs via a `useEffect` (for shared links / Back). Mirror that shape.

## Where the state lives (important)
- `FeedClient` is `key={JSON.stringify(filters)}` in `app/feed/page.tsx`, so it
  **remounts on every filter change**. The mobile filter is rendered *inside* it
  (pinned under the composer via the `mobileFilter` slot).
- `packages/feed/src/filter/feed-section.tsx` (`FeedSection`) sits **above** the
  keyed `FeedClient` and holds the mobile filter's persistent state (`mobileTags`,
  `open`) so it survives the remount. **The optimistic `selected` should be lifted
  here too** and passed down as a controlled prop, the same way `mobileTags`/`open`
  already are — otherwise it resets on every pick.
- Shared single-select chip component: `TagSelect` in
  `packages/feed/src/filter/feed-filters.tsx` (`{ tags, selected, onSelect,
  className }`). Used by both desktop panel and mobile bar/panel. Radio behaviour.
- URL write handler + parser: `packages/feed/src/filter/use-filter-query.ts`
  (`useFilterQuery` builds params from `window.location.search` at call time;
  `parseFilterParams` reads live params).

## Suggested implementation shape
- **Optimistic selected:** add an optimistic `selectedTag` (Tag | null) to
  `FeedSection`, seed from `filters.tag?.[0]`, update it in the mobile `selectTag`
  path, reconcile from the URL like the desktop `useEffect`. Pass it to
  `FeedFilterMobile` so its `selected` (and the panel's) uses the optimistic value
  instead of `value.tag`.
- **Pending indicator:** wrap the `router.replace` (in `useFilterQuery`) in
  `React.useTransition`'s `startTransition`, expose `isPending`, and render a
  loading treatment on the active `TagSelect` chip. `@dmb/ui-kit` already exports a
  `Spinner` (`packages/ui-kit/src/components/spinner.tsx`, `Loader2Icon`). Keep the
  label to avoid layout jump.
- Consider unifying so desktop (`feed-filter-bar.tsx`) and mobile share the pending
  wiring rather than duplicating.

## Verification gotchas (this dev environment)
- **Hydration is slow/flaky after a dev-server restart or fresh compile.** Clicks
  fired before hydration are silently lost. Always confirm hydration first (check
  an element has a `__reactProps$…` key) before interacting.
- **Do NOT `rm -rf .next`** — it triggered a long hydration-failure episode. A
  plain dev-server restart (`preview_stop` + `preview_start name:"dev"`) is enough.
- JS `.click()` on Base UI `Badge`-rendered buttons is unreliable *during*
  navigation; prefer `read_page` refs / real clicks once hydrated.
- `mockLatency` (~1.2s, `packages/feed/src/latency.ts`) is why URL/prop-driven UI
  lags — that's the whole reason optimistic local state is needed.
- Preview: `preview_start` with `name:"dev"`. Login: `eva@dispatch.dev` /
  `eva@dispatch.dev` (password == email; seeded users adam/eva/snake @dispatch.dev).
- Checks: `npx tsc --noEmit` and `npx vitest run` (13 tests currently pass).

## Repo state
- Branch `fix/mru-recency`, **6 commits ahead of `main` (`e346851`)**, HEAD
  `bc1f21f`, working tree clean. Not yet pushed / not yet ff-merged to `main`.
- Recent commits (see `git log`): `bc1f21f` radio tags · `e0ae4f4` mobile
  tap-to-clear · `a11df30` desktop multi-select race fix · `9f7906f` mobile
  newest-first list · `fa4d2a5` moved filter UI into `packages/feed/src/filter/` ·
  `15f342e` persist mobile recency/open · `e346851` mobile filter + app-shell.
- After finishing, the user will likely want a ff-merge of `fix/mru-recency` into
  `main` and a push (`git push origin main`) — confirm first.

## Project conventions (must follow)
- Record **every** user prompt verbatim in `_AI_DIALOG.md`, separated by `---`,
  unless the prompt starts with `skip:`.
- `app/` is router-surface only; domain code lives in `packages/feed`. The filter
  feature UI is now in `packages/feed/src/filter/` (note: that subfolder is the one
  place the package intentionally imports `next/navigation`, because filters are
  URL-synced — documented in `packages/feed/README.md`).
- See `CLAUDE.md` / `AGENTS.md` for the full architecture rules.

## Secondary item (raised, not actioned)
User also asked why there's no scrollbar on mobile. Answer given: it's the browser
default — mobile/touch uses **overlay scrollbars** (hidden until scrolling); the
`min-h-0 flex-1 overflow-y-auto` area does scroll. Only act on this if they ask for
a persistent custom scrollbar.

## Suggested skills
- **`verify`** — drive the tag-select flow end-to-end in the browser preview and
  observe the optimistic highlight + pending state, rather than trusting tests.
- **`react-gradual-architecture`** — the project's own guidance for where the
  optimistic/pending state should live (lift to `FeedSection`, keep chips dumb).
- **`frontend-design`** — optional, for polishing the pending animation so it
  reads well and doesn't cause layout shift.
