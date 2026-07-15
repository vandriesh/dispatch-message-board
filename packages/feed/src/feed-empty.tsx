import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@dmb/ui-kit"

/**
 * The empty state (F11). The container renders this when the filtered query comes
 * back with nothing — distinct from the loading state, which Next serves from
 * app/feed/loading.tsx while the server renders. Two different "nothing here yet"
 * that a single `isLoading ? … : data.length ? …` too often collapses into one.
 */
export function FeedEmpty() {
  return (
    <Empty className="border-[2.5px] border-ink bg-surface">
      <EmptyHeader>
        <EmptyTitle>No messages</EmptyTitle>
        <EmptyDescription>
          Nothing matches these filters yet. Clear them, or be the first to post.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
