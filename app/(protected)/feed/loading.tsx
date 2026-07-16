import { ChevronDownIcon, Settings } from "lucide-react"

import { FeedFilterBar, MessageSkeleton } from "@dmb/feed"
import { Button, Skeleton, Textarea } from "@dmb/ui-kit"

/**
 * The streaming Suspense fallback while the server renders the first page. It
 * mirrors `FeedClient`'s shell box for box, and only what actually waits on the
 * server is a skeleton — the rows and the `n/N pages` count. The composer and
 * LoadMore are inert replicas: a real Composer would take a draft and drop it
 * when this subtree unmounts, and a Server Component can't hand LoadMore its
 * click handlers. The rail's state is the URL, so it's real.
 */
export default function FeedLoading() {
  return (
    <main
      aria-busy
      className="mx-auto flex h-[calc(100dvh-60px)] w-full max-w-[1120px] flex-col gap-8 overflow-hidden p-4 sm:h-[calc(100dvh-72px)] lg:flex-row lg:p-8"
    >
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
            {/* Matches the real composer trigger's metrics so the swap doesn't shift. */}
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

        {/* The mobile filter bar. Its tag chips seed from the URL's tag, which
            only the client knows — so this holds the row's height and the chips
            arrive with the page. */}
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

        {/* `pb-5` per row, not `gap`, matching how the real (virtualized,
            absolutely-positioned) list carries its spacing. */}
        <div aria-hidden className="min-h-0 flex-1 overflow-y-auto">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="pb-5">
              <MessageSkeleton />
            </div>
          ))}
        </div>

        {/* `n/N pages` skeleton. `bg-ink/10` because Skeleton's default bg-muted
            equals the page gray and would be invisible out here. */}
        <div aria-hidden className="flex shrink-0 justify-end pt-1">
          <Skeleton className="h-[19.5px] w-[70px] bg-ink/10" />
        </div>

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
