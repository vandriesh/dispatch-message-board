"use client"

import { Settings } from "lucide-react"

import { Button } from "@dmb/ui-kit"

import { TAGS, type FeedFilters, type Tag } from "../message"
import {
  ClearButton,
  CLEARED_FILTERS,
  TagSelect,
  UserDateFilter,
} from "./feed-filters"
import { useFilterQuery } from "./use-filter-query"

/** How many tag chips the bar shows at once. */
const VISIBLE_TAGS = 3

/**
 * Recency order (least-recent first). The selected tag is pulled to the most
 * recent slot so it always sits inside the visible window; with nothing selected
 * this is just the tag order, whose last three show by default. Used by the owning
 * `FeedSection` to seed the state it holds on this component's behalf.
 */
export function initRecency(selected: Tag | null): Tag[] {
  const base = [...TAGS]
  return selected ? [...base.filter((t) => t !== selected), selected] : base
}

/**
 * The mobile filter (below `lg`). The desktop `FILTERS` rail costs too much
 * vertical space on a phone, so owner + date stay hidden behind a cog. Tags get a
 * quick single-select row: at most three chips, the most-recently-used ones, one
 * active at a time (tap the active chip to clear it). Selecting a tag that isn't
 * shown — from the cog panel, which lists all four — makes it active and slides
 * it into the row, evicting the least-recently-used so three remain.
 *
 * Controlled: the open state and the recency order live in `FeedSection`, one
 * level *above* the filter-keyed `FeedClient`, so they survive its per-filter
 * remount — otherwise every pick would reset the window (chips would reshuffle).
 * The active filter itself lives in the query string (via `useFilterQuery`).
 */
export function FeedFilterMobile({
  value,
  recency,
  onRecencyChange,
  open,
  onOpenChange,
}: {
  value: FeedFilters
  recency: Tag[]
  onRecencyChange: (next: Tag[]) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const onFilterChange = useFilterQuery()

  const selected = value.tag?.[0] ?? null
  const visible = recency.slice(-VISIBLE_TAGS)

  function selectTag(tag: Tag) {
    if (tag === selected) {
      onFilterChange({ tag: undefined }) // tapping the active tag clears it
      return
    }
    // A hidden tag slides into the window (evicting the oldest); a tag already on
    // screen just becomes active without reshuffling the row.
    if (!visible.includes(tag)) {
      onRecencyChange([...recency.filter((t) => t !== tag), tag])
    }
    onFilterChange({ tag: [tag] })
  }

  return (
    <div className="flex shrink-0 flex-col lg:hidden">
      {/* The bar: the recent-three tag chips on the left, cog on the right. */}
      <div className="flex items-center gap-2">
        <TagSelect
          tags={visible}
          selected={selected}
          onSelect={selectTag}
          className="min-w-0 flex-1 flex-nowrap overflow-x-auto"
        />
        <Button
          type="button"
          variant={open ? "default" : "outline"}
          size="icon-sm"
          aria-label="Toggle filters"
          aria-expanded={open}
          aria-controls="mobile-filters"
          onClick={() => onOpenChange(!open)}
          className="ml-auto"
        >
          <Settings />
        </Button>
      </div>

      {/*
        Collapsible full filters. The grid-rows 0fr→1fr transition animates the
        real height so the feed below is pushed down; `inert` when closed keeps the
        clipped controls out of the tab order and the a11y tree.
      */}
      <div
        id="mobile-filters"
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-6 pt-4" inert={!open}>
            <div>
              <div className="mb-[10px] font-mono text-[11px] font-bold tracking-[0.08em] text-muted-foreground uppercase">
                Tag
              </div>
              <TagSelect tags={TAGS} selected={selected} onSelect={selectTag} />
            </div>
            <UserDateFilter value={value} onFilterChange={onFilterChange} />
            <ClearButton onClick={() => onFilterChange(CLEARED_FILTERS)} />
          </div>
        </div>
      </div>
    </div>
  )
}
