import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@dmb/ui-kit"

/**
 * The empty state (F11). The container renders this when the filtered query comes
 * back with nothing — distinct from the loading state, which Next serves from
 * app/feed/loading.tsx while the server renders. Two different "nothing here yet"
 * that a single `isLoading ? … : data.length ? …` too often collapses into one.
 *
 * Laid out to the reference design: a dashed ink frame over a 45° hatch filling
 * the whole scroll region, so the gap reads as a placeholder *surface* rather
 * than a card that failed to load.
 *
 * `min-h-full`, not the `flex-1` the primitive already carries: the scroll region
 * it drops into is a block (it belongs to the virtualizer the rest of the time),
 * so there is no flex context for that to grow in. `min-h` rather than `h` so a
 * viewport too short for the content scrolls instead of clipping it.
 * The `!` badge is the one raised thing here, carrying the same border and offset
 * shadow as the buttons — and it's decorative, so it stays out of the a11y tree
 * rather than announcing "exclamation mark" ahead of the copy that means it.
 */
export function FeedEmpty() {
  return (
    <Empty className="min-h-full gap-0 border-[3px] border-ink bg-hatch p-6 sm:p-10">
      <EmptyHeader className="max-w-[360px] gap-0">
        <EmptyMedia
          aria-hidden
          className="mb-[18px] size-14 border-[3px] border-ink bg-primary text-[28px] font-bold shadow-brutal-sm sm:mb-6 sm:size-[72px] sm:text-[34px] sm:shadow-brutal-md"
        >
          !
        </EmptyMedia>
        <EmptyTitle className="text-[19px] font-bold sm:text-2xl">
          Nothing here yet
        </EmptyTitle>
        <EmptyDescription className="mt-2 text-xs leading-[1.6] sm:text-sm">
          No messages match this view. Post the first one, or clear your filters.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
