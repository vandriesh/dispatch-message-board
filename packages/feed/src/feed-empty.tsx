import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@dmb/ui-kit"

/**
 * The empty state, filling the whole scroll region so the gap reads as a
 * placeholder surface rather than a card that failed to load. `min-h-full`
 * because the scroll region is a block (the virtualizer owns it the rest of
 * the time) — there's no flex context for the primitive's `flex-1` to grow in.
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
