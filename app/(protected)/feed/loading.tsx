import { ChevronDownIcon, Settings } from "lucide-react"

import { FeedFilterBar, MessageSkeleton } from "@dmb/feed"
import { Button, Skeleton, Textarea } from "@dmb/ui-kit"

/**
 * The feed's loading state (F11), served by Next as the Suspense fallback while
 * the server renders the first filtered page. This is the "if loading" branch of
 * the container — delegated to the framework's streaming boundary rather than a
 * client `isLoading` flag. It is actually seen because the SSR fetch waits out
 * the mock latency first (ADR-005).
 *
 * A placeholder is only worth anything if it reproduces the layout it stands in
 * for, so this mirrors `FeedClient`'s shell box for box: composer pinned at the
 * top, the rows scrolling in what's left, the page readout and LOAD MORE / LOAD
 * ALL parked at the bottom. The rows scroll rather than clip, so the scrollbar is
 * already there and the column doesn't narrow when the real list arrives.
 *
 * Only what waits on the server is a skeleton — the rows, and the `n/N pages`
 * count that needs the total. Everything else is real, because nothing else needs
 * data: the filter rail initializes from the URL (ADR-002), and the composer and
 * the bottom controls are just chrome.
 *
 * The two exceptions are inert replicas rather than the real components, and for
 * different reasons: `Composer` owns its draft in local state, so a real one here
 * would take a message during the wait and drop it when this subtree unmounts;
 * `LoadMore` takes click handlers, which a Server Component cannot hand a Client
 * Component. The rail has neither problem — its state is the URL — so it's real.
 */
export default function FeedLoading() {
  return (
    <main
      aria-busy
      className="mx-auto flex h-[calc(100dvh-60px)] w-full max-w-[1120px] flex-col gap-8 overflow-hidden p-4 sm:h-[calc(100dvh-72px)] lg:flex-row lg:p-8"
    >
      {/* Real, not skeletoned — same wrapper as page.tsx. Hidden below `lg`,
          where the layout collapses it into the cog panel. */}
      <div className="hidden lg:block lg:w-[296px] lg:shrink-0">
        <FeedFilterBar />
      </div>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <div
          aria-hidden
          className="flex shrink-0 flex-col gap-3 border-[3px] border-ink bg-surface p-4 shadow-brutal-md"
        >
          <Textarea readOnly tabIndex={-1} placeholder="Say it in 240…" />
          <div className="flex items-center justify-between gap-3">
            {/* The composer's Select trigger keeps shadcn's own metrics (h-8, 1px
                border) — unlike the rail's, which is overridden to the 52px
                brutalist control. Matched here so the swap doesn't shift. */}
            <div className="flex h-8 w-40 items-center justify-between border border-ink px-2.5 text-sm">
              PRODUCT
              <ChevronDownIcon className="size-4 opacity-50" />
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[13px] text-muted-foreground">
                0/240
              </span>
              <Button disabled>POST</Button>
            </div>
          </div>
        </div>

        {/* The mobile filter bar (below `lg`), where the rail is hidden and the
            cog stands in for it. Its tag chips seed from the URL's tag, which
            only the client knows — so the bar holds the row's height and the
            chips arrive with the page. */}
        <div aria-hidden className="flex shrink-0 items-center gap-2 lg:hidden">
          <Button
            variant="outline"
            size="icon-sm"
            disabled
            className="ml-auto"
            aria-label="Toggle filters"
          >
            <Settings />
          </Button>
        </div>

        {/* The rows — the only part actually waiting on the server. `pb-5` per
            row, not a `gap`, is how the real list carries its 20px: the
            virtualizer absolutely-positions rows, which drops CSS `gap`, so the
            spacing lives inside each measured element (feed.tsx). */}
        <div aria-hidden className="min-h-0 flex-1 overflow-y-auto">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="pb-5">
              <MessageSkeleton />
            </div>
          ))}
        </div>

        {/* `n/N pages` — the one other thing that needs the server, since the
            total is the filter's match count. It needs its own tone: `Skeleton`
            is `bg-muted`, and `--muted` *is* `--page`, so the default is
            invisible out here on the gray and only reads inside the cards. */}
        <div aria-hidden className="flex shrink-0 justify-end pt-1">
          {/* 19.5px is the real line box: 13px Space Mono at its natural
              line-height. Guessing here costs the rows the difference. */}
          <Skeleton className="h-[19.5px] w-[70px] bg-ink/10" />
        </div>

        {/* LOAD MORE / LOAD ALL (load-more.tsx). Disabled: there is genuinely
            nothing to page through yet, and the labels and sizes are the loaded
            ones, so only the opacity changes when the feed lands. */}
        <div className="flex shrink-0 justify-center pt-1">
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="lg" disabled>
              LOAD MORE ↓
            </Button>
            <Button variant="default" size="lg" disabled>
              LOAD ALL ⇊
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
