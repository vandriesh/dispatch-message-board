"use client"

import * as React from "react"
import { useVirtualizer } from "@tanstack/react-virtual"

import { OwnerMessageCard } from "./owner-message-card"
import { type FeedRow } from "./rbac"
import { SimpleCard } from "./simple-card"

/**
 * The feed list (F4, B2) — presentational over already-fetched, already-filtered
 * rows, virtualized with `@tanstack/react-virtual` so 1000+ entries stay smooth
 * (ADR-004/006). It renders only the visible window plus `OVERSCAN`, absolutely
 * positioned inside a spacer sized to the whole list, so the DOM holds a few dozen
 * rows no matter how many the query has loaded.
 *
 * The scroll container is **not** owned here: `FeedClient` owns the app-shell
 * scroll region and hands the resolved element down (`scrollElement`), so the
 * virtualizer measures the product's own markup rather than introducing a second
 * scroller. It's passed as the *element* (state-backed via a callback ref), not a
 * ref object: the scroller is the parent of this component, and a parent's ref is
 * attached only *after* this child's layout effects run — so a plain ref would
 * read `null` when the virtualizer first measures and never recover. Threading the
 * element through state re-renders this component once it exists, and the
 * virtualizer picks it up.
 *
 * Rows change height — a message wraps to 1–4 lines, and an owner row grows when
 * it enters edit mode — so heights are **measured**, not estimated: each row wraps
 * `measureElement`, and the virtualizer re-measures on resize. `estimateSize` is
 * only the first-paint guess before real heights land.
 *
 * Auto-fetch-on-approach (ADR-004) lives here too, because in a virtualized list
 * the classic IntersectionObserver sentinel never renders and so can never
 * intersect: instead, when the last virtual row reaches the end of the loaded
 * array, `onNeedMore` advances the cursor. The LOAD MORE / LOAD ALL buttons in
 * `FeedClient` remain the focusable, announceable baseline on top of this.
 */

// A first-paint height guess (~header + one line + tag row + the 20px gap). Real
// heights replace it as each row measures, so this only affects the initial
// scrollbar before measurement settles.
const ESTIMATED_ROW = 172
// Rows kept mounted above and below the viewport, so a fast scroll doesn't flash
// blank before the next window paints.
const OVERSCAN = 8

export function Feed({
  data,
  scrollElement,
  rowError,
  onEdit,
  onDelete,
  hasNextPage,
  isFetchingNextPage,
  onNeedMore,
}: {
  data: FeedRow[]
  /** The app-shell scroll region, owned by `FeedClient` (state-backed element). */
  scrollElement: HTMLElement | null
  rowError?: { id: string; message: string } | null
  onEdit: (id: string, body: string) => void
  onDelete: (id: string) => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  /** Advance the cursor when the last loaded row scrolls into view. */
  onNeedMore: () => void
}) {
  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => ESTIMATED_ROW,
    overscan: OVERSCAN,
    // Keyed by message id so the virtualizer's measurement cache follows a row
    // across inserts (a new optimistic post at the top) rather than by position.
    getItemKey: (index) => data[index].id,
  })

  const virtualItems = virtualizer.getVirtualItems()

  // Auto-fetch: once the last loaded row is within the rendered window, pull the
  // next page. Guarded on `hasNextPage`/`isFetchingNextPage` so it fires once per
  // page rather than every scroll frame; React Query dedupes the button path too.
  const lastIndex = virtualItems.at(-1)?.index
  React.useEffect(() => {
    if (lastIndex === undefined) return
    if (hasNextPage && !isFetchingNextPage && lastIndex >= data.length - 1) {
      onNeedMore()
    }
  }, [lastIndex, hasNextPage, isFetchingNextPage, data.length, onNeedMore])

  return (
    <div
      style={{ height: virtualizer.getTotalSize(), position: "relative", width: "100%" }}
    >
      {virtualItems.map((item) => {
        const message = data[item.index]
        return (
          <div
            key={item.key}
            data-index={item.index}
            ref={virtualizer.measureElement}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${item.start}px)`,
            }}
          >
            {/* The 20px inter-row gap lives inside the measured element so total
                size accounts for it (absolute positioning drops CSS `gap`). */}
            <div className="pb-5">
              {message.owner ? (
                <OwnerMessageCard
                  message={message}
                  error={rowError?.id === message.id ? rowError.message : null}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ) : (
                <SimpleCard message={message} />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
