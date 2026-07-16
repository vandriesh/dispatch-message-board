# Dispatch — Message Board

## Install & Run

You need Node.js version **20.9 or newer**.

There is nothing to configure — no `.env` file, no database, no API keys. The "backend"
is fake: the server makes up its data in memory every time it starts.

```bash
npm install
npm run dev     # then open http://localhost:3000
```

Other commands you can run:

- `npm test` — runs the unit tests
- `npm run build` — builds the app for production
- `npm run lint` — checks the code style

## Design System

There is also a page at `/ui-kit` that shows every button, input, and badge the app uses,
so you can see all the building blocks in one place.

## Login Credentials

There is no sign-up. Three accounts already "exist", and for each of them **the password is
the same as the email**:

- `adam@dispatch.dev`
- `eva@dispatch.dev`
- `snake@dispatch.dev`

So to log in as Eva, type `eva@dispatch.dev` in **both** fields.

If the email and password don't match, login fails. That is intentional — it gives the
error message a real reason to appear, so you can see how the app handles a failed login.

## Structure

**The big idea: code is grouped by what it does for the user (feature), not by what kind of
file it is.** There is no giant `components/` or `utils/` folder where everything gets dumped.
Instead, everything about the feed lives in the feed package, everything about login lives in
the auth package, and so on.

Each feature is a separate **workspace package** (a mini-package inside the same repo, with
its own name like `@dmb/feed`). Why bother? Because packages can only use what they declare.
That means the rules below are **enforced by the tooling, not by people remembering them**:

- `@dmb/ui-kit` (the design system) *cannot* import feature code — so a Button can never
  secretly learn what a "Message" is.
- The fake-data library (`faker`, ~5MB) *cannot* end up in the code shipped to the browser.

The domain code is also **framework-agnostic**: `@dmb/feed` doesn't know it runs inside
Next.js. You could move it to another React framework (Remix, TanStack Start) without
rewriting it. There is exactly one exception, and it's deliberate: the filters live in the
URL (so links are shareable), and reading/writing the URL requires the framework's router.
**Two files** in `filter/` import `next/navigation`. Think of them as the
**adapter** — the one small plug that connects the feature to Next.js. If you ever migrate
frameworks, those two files are the only ones you rewrite.

Here is the folder map:

```
app/                    # Next.js routes ONLY — these files just wire things up,
                        # the real logic lives in packages/
  (auth)/login/         #   the login page (uses a Server Action + a cookie for the session)
  api/messages/         #   the API: GET, POST, PATCH, DELETE for messages
  (protected)/feed/     #   page.tsx renders the first page on the server,
                        #   loading.tsx shows a skeleton while it loads
                        #   layout.tsx holds the top bar with the avatar + logout button
packages/
  ui-kit/               # @dmb/ui-kit — buttons, inputs, badges. Knows nothing about messages.
  auth/src/             # @dmb/auth  — the login form + its validation. Imports no next/* code.
  feed/src/             # @dmb/feed  — everything about messages:
    message.ts          #   the Message type, defined next to the code that creates messages
    store.ts query.ts   #   server-only: creates the fake data and reads pages of it —
                        #   this code must NEVER reach the browser
    feed-client.tsx     #   the "brain" of the feed: fetching pages, posting, editing, deleting
    feed.tsx            #   the visible list itself
    filter/             #   the tag/user/date filters, synced with the URL
                        #   (the ONLY place that imports next/navigation)
```

One more trick: each feature exposes **two entry points**. `@dmb/feed` is safe to import
from browser code; `@dmb/feed/server` is marked `server-only`, so if browser code ever tries
to import it, the build fails. That's the mechanism that guarantees the ~5MB faker library
can never be sent to users.

## Checklist

Everything the assignment asked for, and all of it is done:

| ✓ | Requirement                                                                      |
|---|----------------------------------------------------------------------------------|
| ✅ | Login — the three seeded users above; there is no sign-up                        |
| ✅ | Post a message of up to 240 characters, with a tag                               |
| ✅ | Filter the feed by tag, by user, and by date & time                              |
| ✅ | Edit and delete your **own** messages, right in the list (others' are read-only) |
| ✅ | Both a `LOAD MORE` button **and** infinite scroll                                |
| ✅ | Loading state (skeleton) and an empty state ("no results")                       |
| ✅ | Works on mobile and desktop                                                      |
| ✅ | Filters are stored in the URL, so a filtered view can be shared or bookmarked    |

## Beyond the brief

Things that weren't asked for but made the app better:

- **A mobile-friendly filter.** On a phone, the full filter panel would eat half the screen.
  So the user and date filters hide behind a `⚙` (cog) button, while tags stay visible as a
  row of chips (the first 3, most recently used first). Tapping a tag filters by it; tapping
  it again clears the filter; picking a new tag moves it to the front of the row. If you open
  a shared link like `?tag=RANDOM`, that chip starts already selected. Only one tag can be
  active at a time.
- **Filters respond instantly.** The fake server takes ~1.2 seconds to answer. Instead of
  making you wait, the tapped chip lights up immediately and shows a small spinner while the
  real results load. Under the list, a small `3/400 pages` counter shows how much of the feed
  you've loaded.
- **Deleting takes two clicks, no popup.** Clicking `DELETE` swaps the button into a
  confirm/cancel pair right where it was — no modal dialog to dismiss.
- **A failed post never loses your text.** If the server rejects a message, your draft is put
  back into the composer, and the error message appears next to whatever caused it (under the
  composer for a failed post, on the row for a failed edit/delete).
- **A compact mobile top bar.** Your name and the `LOG OUT` button fold behind your avatar —
  tap it to open a small popup.
- **The `/ui-kit` page** shows every design-system component, so it's easy to spot when a
  component drifts away from the intended look.

## Suggestions

Improvements I would make next, if this kept going:

- **An `Apply` button for the filters.** Right now every filter change immediately fires a
  request. If you change tag, then user, then date, that's three requests, and the first two
  are thrown away. Better: let the user set up all filters locally, then press `Apply` to
  send **one** request. This matters more now that the date range includes a time — that's
  four inputs, i.e. four wasted requests.
- **Show active filters as removable chips on mobile**, like `[user: @adam ×]`
  `[tag: RANDOM ×]` — one tap on the `×` clears just that filter.
- **Collapse the composer (create message form) on mobile.** The "write a message" box takes a lot of phone
  screen for something you do occasionally. Hide it behind a pencil icon in the top bar.
- **End-to-end tests with Playwright** for the critical journey: log in → post → filter →
  edit/delete. The current tests (React Testing Library) run components in isolation, so
  they can't test the login flow's Server Action + cookie + redirect — that needs a real
  browser.
- **CI/CD** — run typecheck, lint, tests, and build on every pull request, plus a
  **bundle-size budget**: the build fails if the JavaScript sent to the browser grows past
  a limit.

## Bonus Points

- **Virtualization.** The feed can hold 1000 messages, but the browser only ever renders
  the ~10–13 rows you can actually see (`@tanstack/react-virtual`). As you scroll, rows are
  recycled. Row heights are measured live, because a row grows when you edit it. There's a
  `LOAD ALL` button that fetches everything in one request, so you can see virtualization
  handle 1000 rows without clicking `LOAD MORE` 50 times. Supposedly to be "dev tool"
- **Optimistic UI with rollback.** When you post, edit, or delete, the screen updates
  *immediately*, before the server answers. If the server then fails, the change is rolled
  back. You can trigger a failure on purpose with magic words:
    - CREATE/EDIT: include the word **`fail`** in the message body → the server returns a 500
      error and the row rolls back;
    - DELETE: delete a message that contains the word **`keep`** → the delete fails and the
      row comes back. (It has to be a different word: a message containing `fail` can never be
      saved in the first place, so it could never exist for you to delete.)

  The fake ~1.2s server delay exists exactly so you can *see* the optimistic update happen
  before the server responds.
- **Real API routes.** The endpoints under `/api/messages` behave like a real backend:
  pagination uses a cursor (each response tells you where the next page starts), all input
  is validated with `zod`, and the server decides who the author is — the client is never
  trusted to say "this edit is by Adam". Zod validation is shared between the client and server,  
  so the two sides can't drift.
- **Tests** - I've added msw to mimic the backend's success/error response and check for error messages.
  in the end mocking server was substituted with mock server - since in next js things run differently than
  a simple fetch; I already few youtube videos about testing nextjs server actions - might be interesting to see
  how useful this msw+next combination is.
- **Tests** — 17 of them (most added by AI), covering three flows: the login form, the optimistic
  rollback, and the date-range filter (its edge cases: the start and end of the range are
  included; filtering is exact to the second; and a date without a time, like `2026-07-16`,
  still means the whole UTC day — that last rule keeps older shared links working).

## Bonus Questions

**Q: What rendering strategy (SSR, SSG, ISR, CSR) would you use for each page and why?**

> A few pages here are static (SSG); the rest are SSR. The build output shows it bests:
> to make SSG - I've moved toolbar from global layout into dedicated, so the global layout is static.
> The toolbar is the details that made possible to have SSG pages by moving it under protected area.
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
> The rule that decides each page is a single question: **does the HTML depend on the
> request** — on cookies, URL query params, or headers? If yes, it must be rendered per
> request (SSR). If no, it can be built once (SSG). `/login` and `/ui-kit` look the same for
> everyone → static. `/feed` depends on your session cookie *and* the filters in the URL →
> dynamic.
>
> One subtlety: `/feed` is dynamic mainly because of the **filters**. The
> browser only holds 20 of the 1000 messages, so it can't filter locally — it has to ask the
> server. And because the filter lives in the URL, the server sees it on the first request
> and the page stays shareable.

**Q: How would you keep the bundle small and avoid unnecessary re-renders as the feature set grows?**
>
> No particular order.
>- **Virtualize long lists** — only ~10–13 DOM rows exist for 1000 messages
> ([feed.tsx:4,68](packages/feed/src/feed.tsx)).
>- **Know what each library costs before adding it.** Measure it. E.g. react-day-picker (the
> calendar) is **16.3kb gzipped**
>- **Code splitting, demonstrated on the calendar.** "Code splitting" means cutting the
> bundle into pieces that load only when needed. The calendar is loaded with `React.lazy`,
> so its code is downloaded only when someone first opens the date popover
> ([filter/date-time-field.tsx](packages/feed/src/filter/date-time-field.tsx)).
>
> **Re-renders** (a re-render isn't a bug, but re-rendering 1000 rows on every keystroke is):
>
>- Virtualization already means React only works with the handful of rows on screen.
>- When the filters change, the whole `FeedClient` is **deliberately remounted** — it gets a
> `key` that changes with the filter set
> ([filter/feed-section.tsx:55](packages/feed/src/filter/feed-section.tsx)). That wipes the
> query cache and any optimistic state on purpose. It's a chosen reset, not an accidental
> re-render cascade.
>- **Keep state as low in the tree as possible.** The row being edited owns its own draft
> text ([owner-message-card.tsx:36,37,113](packages/feed/src/owner-message-card.tsx)), so
> typing re-renders that one row — not the other 999.
>- **Stable keys by message id** — as you scroll, the virtualizer reuses row components
> instead of destroying and rebuilding them ([feed.tsx:75,99](packages/feed/src/feed.tsx)).

**Q: What would you check first if users reported the feed felt janky while scrolling? What would be your debugging
steps to isolate the performance bottleneck?**

> **Check first**
>
> Janky scrolling in a feed is the classic symptom of too many rows in the DOM — which is
> exactly what virtualization prevents. So:
>
>- First, reproduce it at the volume that triggers it — load 1000+ rows (the `LOAD ALL`
> button exists for this) and confirm the jank is real, on a realistic device.
>
> **Isolate the bottleneck**
>
>- Record a session with the **React Profiler** (in React DevTools) while scrolling. It
> shows *which* components re-rendered and *why*. The usual culprits: a context whose value
> is a new object on every render, or a prop that's recreated each time (inline object /
> array / function), which makes every consumer re-render.
>- Change **one thing**, then re-measure against the **same** recording setup. If you fix
> three things at once, you don't know which one worked — or whether one of them made it
> worse.
>- If this feed were *not* virtualized, my prior would be: too many DOM nodes first,
> un-memoized row components second.
