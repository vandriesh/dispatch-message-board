"use client"

import { type ReactNode } from "react"
import {
  Badge,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from "@dmb/ui-kit"

import { TAGS, USERS, type FeedFilters, type Tag } from "../message"

// Sentinel for the user dropdown's "show everyone" option — selecting it clears
// the owner filter rather than filtering to a user named "all".
const ALL_USERS = "all"

/** The patch that resets every filter. */
export const CLEARED_FILTERS: Partial<FeedFilters> = {
  tag: undefined,
  user: undefined,
  from: undefined,
  to: undefined,
}

/**
 * The tag chips (F5) — multi-select, the accent-filled `Badge` is the pressed
 * state. Used on the desktop rail, where any number of tags can be active.
 */
function TagFilter({
  value,
  onFilterChange,
}: {
  value: FeedFilters
  onFilterChange: (patch: Partial<FeedFilters>) => void
}) {
  const selectedTags = value.tag ?? []

  function toggleTag(tag: Tag) {
    const next = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag]
    onFilterChange({ tag: next.length > 0 ? next : undefined })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {TAGS.map((tag) => {
        const selected = selectedTags.includes(tag)
        return (
          <Badge
            key={tag}
            variant={selected ? "default" : "outline"}
            render={
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => toggleTag(tag)}
              />
            }
          >
            {tag}
          </Badge>
        )
      })}
    </div>
  )
}

/**
 * Single-select tag chips (mobile, F5) — presentational. Unlike the multi-select
 * `TagFilter` on the desktop rail, exactly one tag is active at a time; tapping
 * the active one clears it. The caller owns which tags to render (the mobile bar
 * shows the recent few, the cog panel shows all) and the selection/MRU logic.
 */
export function TagSelect({
  tags,
  selected,
  onSelect,
  className,
}: {
  tags: readonly Tag[]
  selected: Tag | null
  onSelect: (tag: Tag) => void
  className?: string
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {tags.map((tag) => (
        <Badge
          key={tag}
          variant={selected === tag ? "default" : "outline"}
          render={
            <button
              type="button"
              aria-pressed={selected === tag}
              onClick={() => onSelect(tag)}
            />
          }
        >
          {tag}
        </Badge>
      ))}
    </div>
  )
}

/**
 * The owner dropdown (F7) and date range (F6) — the filters that don't collapse
 * to a chip. On mobile these live behind the cog; on desktop they sit under the
 * tags in the rail.
 */
export function UserDateFilter({
  value,
  onFilterChange,
}: {
  value: FeedFilters
  onFilterChange: (patch: Partial<FeedFilters>) => void
}) {
  const currentUser = value.user?.[0] ?? ALL_USERS

  return (
    <>
      <div>
        <FilterLabel>User</FilterLabel>
        <Select
          value={currentUser}
          onValueChange={(next) =>
            onFilterChange({
              user: next === ALL_USERS ? undefined : [String(next)],
            })
          }
        >
          <SelectTrigger className="w-full border-[2.5px] border-ink bg-surface px-4 data-[size=default]:h-[52px]">
            <SelectValue>
              {(selected) => {
                const owner = USERS.find((u) => u.id === selected)
                return owner ? `@${owner.handle}` : "All users"
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_USERS}>All users</SelectItem>
            {USERS.map((owner) => (
              <SelectItem key={owner.id} value={owner.id}>
                @{owner.handle}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <FilterLabel>Date</FilterLabel>
        <div className="flex flex-col gap-2">
          <Input
            type="date"
            aria-label="From"
            value={value.from ?? ""}
            max={value.to}
            onChange={(event) =>
              onFilterChange({ from: event.target.value || undefined })
            }
          />
          <Input
            type="date"
            aria-label="To"
            value={value.to ?? ""}
            min={value.from}
            onChange={(event) =>
              onFilterChange({ to: event.target.value || undefined })
            }
          />
        </div>
      </div>
    </>
  )
}

/**
 * The filter sidebar (F5/F6/F7) — presentational, laid out to the reference
 * design's desktop `FILTERS` rail: a borderless column on the gray page, with a
 * `clear` affordance, tag chips, a user dropdown, and a stacked date range. It
 * reports changes through `onFilterChange({ [field]: values })` and knows nothing
 * about the URL — that lives in the container (app/feed/feed-filter-bar.tsx),
 * the same seam @dmb/auth uses to keep `next/*` out of the feature package.
 *
 * It composes `TagFilter` and `UserDateFilter`; the mobile layout reuses those
 * two pieces directly around a cog toggle (app/feed/feed-filter-mobile.tsx).
 */
export function FeedFilterPanel({
  value,
  onFilterChange,
}: {
  value: FeedFilters
  onFilterChange: (patch: Partial<FeedFilters>) => void
}) {
  return (
    <aside className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-[13px] font-bold tracking-[0.1em]">FILTERS</h2>
        <ClearButton onClick={() => onFilterChange(CLEARED_FILTERS)} />
      </div>

      <div>
        <FilterLabel>Tag</FilterLabel>
        <TagFilter value={value} onFilterChange={onFilterChange} />
      </div>

      <UserDateFilter value={value} onFilterChange={onFilterChange} />
    </aside>
  )
}

/** The `clear` link — shared by the desktop rail header and the mobile panel. */
export function ClearButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer text-[12px] text-muted-foreground underline"
    >
      clear
    </button>
  )
}

function FilterLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-[10px] font-mono text-[11px] font-bold tracking-[0.08em] text-muted-foreground uppercase">
      {children}
    </div>
  )
}
