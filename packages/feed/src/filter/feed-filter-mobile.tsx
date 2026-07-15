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
 * The mobile filter (below `lg`). The desktop `FILTERS` rail costs too much
 * vertical space on a phone, so owner + date stay hidden behind a cog. Tags get a
 * quick single-select row driven by `mobileTags` — a newest-first list of the
 * tags picked so far (held by the owning `FeedSection`):
 *
 *   - the bar shows the first three of `mobileTags` — empty at first, so just the
 *     cog until a tag is picked from the panel;
 *   - picking a tag not yet in the list pushes it to the front and selects it, so
 *     it lands leftmost and any fourth falls off the visible three;
 *   - picking a tag already in the list just selects it, leaving the order alone.
 *
 * Controlled so the list and the open state survive `FeedClient`'s per-filter
 * remount (see FeedSection). The active filter itself lives in the query string
 * (via `useFilterQuery`).
 */
export function FeedFilterMobile({
  value,
  mobileTags,
  onMobileTagsChange,
  open,
  onOpenChange,
}: {
  value: FeedFilters
  mobileTags: Tag[]
  onMobileTagsChange: (next: Tag[]) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const onFilterChange = useFilterQuery()

  const selected = value.tag?.[0] ?? null
  const visible = mobileTags.slice(0, VISIBLE_TAGS)

  function selectTag(tag: Tag) {
    // First time a tag is picked it joins the front of the list (pushing any
    // fourth off the visible three); an already-listed tag just gets selected.
    if (!mobileTags.includes(tag)) {
      onMobileTagsChange([tag, ...mobileTags])
    }
    onFilterChange({ tag: [tag] })
  }

  return (
    <div className="flex shrink-0 flex-col lg:hidden">
      {/* The bar: the first three picked tags on the left (empty at first), cog right. */}
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
