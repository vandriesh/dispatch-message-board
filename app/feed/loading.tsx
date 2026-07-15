import { Skeleton } from "@dmb/ui-kit"

/**
 * The feed's loading state (F11), served by Next as the Suspense fallback while
 * the server renders the first filtered page. This is the "if loading" branch of
 * the container — delegated to the framework's streaming boundary rather than a
 * client `isLoading` flag, so it costs no client JS. It mirrors the two-column
 * grid so the layout doesn't jump when the real page streams in.
 */
export default function FeedLoading() {
  return (
    <main className="mx-auto grid w-full max-w-[1120px] grid-cols-1 gap-8 p-4 lg:grid-cols-[296px_1fr] lg:p-8">
      <aside className="flex flex-col gap-6">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-24 w-full" />
      </aside>

      <section className="flex flex-col gap-4">
        <Skeleton className="h-40 w-full" />
        <div className="flex flex-col gap-3" aria-hidden>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      </section>
    </main>
  )
}
