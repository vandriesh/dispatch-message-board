"use client"

import { type ReactNode } from "react"
import {
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  cn,
} from "@dmb/ui-kit"

import { TAGS, USERS, type FeedFilters, type Tag } from "../message"
import { DateTimeField, parseBound } from "./date-time-field"

// Sentinel for the dropdown's "show everyone" option — selecting it clears the
// user filter.
const ALL_USERS = "all"

export const CLEARED_FILTERS: Partial<FeedFilters> = {
  tag: undefined,
  user: undefined,
  from: undefined,
  to: undefined,
}

/**
 * Tag chips, radio behaviour: one tag active at a time; clicking the active
 * chip clears it. `pending` overlays a spinner while the selection commits —
 * the label keeps its box, so the chip doesn't change width mid-flight.
 */
export function TagSelect({
  tags,
  selected,
  onSelect,
  pending,
  className,
}: {
  tags: readonly Tag[]
  selected: Tag | null
  onSelect: (tag: Tag) => void
  pending?: Tag | null
  className?: string
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {tags.map((tag) => {
        const isPending = pending === tag
        return (
          <Badge
            key={tag}
            variant={selected === tag ? "default" : "outline"}
            className="relative"
            render={
              <button
                type="button"
                aria-pressed={selected === tag}
                aria-busy={isPending}
                onClick={() => onSelect(tag)}
              />
            }
          >
            <span className={isPending ? "invisible" : undefined}>{tag}</span>
            {isPending && (
              <Spinner className="absolute size-3 text-current" />
            )}
          </Badge>
        )
      })}
    </div>
  )
}

// The filters that don't collapse to a chip: on mobile these live behind the
// cog, on desktop under the tags in the rail.
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
        <div className="flex flex-col gap-3">
          <DateTimeField
            label="From"
            edge="start"
            value={value.from}
            max={parseBound(value.to, "end")}
            onChange={(from) => onFilterChange({ from })}
          />
          <DateTimeField
            label="To"
            edge="end"
            value={value.to}
            min={parseBound(value.from, "start")}
            onChange={(to) => onFilterChange({ to })}
          />
        </div>
      </div>
    </>
  )
}

/**
 * The desktop filter rail — presentational, knows nothing about the URL (that
 * lives in the container, keeping `next/*` out of this package). The mobile
 * layout reuses TagSelect and UserDateFilter around the cog toggle.
 */
export function FeedFilterPanel({
  value,
  onFilterChange,
  pending,
}: {
  value: FeedFilters
  onFilterChange: (patch: Partial<FeedFilters>) => void
  pending?: Tag | null
}) {
  const selectedTag = value.tag?.[0] ?? null

  return (
    <aside className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-[13px] font-bold tracking-[0.1em]">FILTERS</h2>
        <ClearButton onClick={() => onFilterChange(CLEARED_FILTERS)} />
      </div>

      <div>
        <FilterLabel>Tag</FilterLabel>
        <TagSelect
          tags={TAGS}
          selected={selectedTag}
          pending={pending}
          onSelect={(tag) =>
            onFilterChange({ tag: tag === selectedTag ? undefined : [tag] })
          }
        />
      </div>

      <UserDateFilter value={value} onFilterChange={onFilterChange} />
    </aside>
  )
}

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
