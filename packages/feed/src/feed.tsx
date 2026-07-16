"use client"

import * as React from "react"
import { useVirtualizer } from "@tanstack/react-virtual"

import { OwnerMessageCard } from "./owner-message-card"
import { type FeedRow } from "./rbac"
import { SimpleCard } from "./simple-card"

/**
 * The virtualized feed list: the DOM holds a few dozen rows no matter how many
 * are loaded. Row heights are measured, not estimated — a message wraps to 1–4
 * lines and an owner row grows in edit mode. Infinite scroll lives here rather
 * than on an IntersectionObserver sentinel, because in a virtualized list a
 * sentinel never renders and so can never intersect.
 */

// First-paint height guess; real measurements replace it.
const ESTIMATED_ROW = 172
// Rows kept mounted past the viewport so a fast scroll doesn't flash blank.
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
    // Keyed by id, not position, so the measurement cache follows a row when an
    // optimistic post is inserted at the top.
    getItemKey: (index) => data[index].id,
  })

  const virtualItems = virtualizer.getVirtualItems()

  // Infinite scroll: once the last loaded row enters the rendered window, pull
  // the next page.
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
