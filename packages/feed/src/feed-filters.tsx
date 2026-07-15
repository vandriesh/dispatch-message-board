"use client"

import {
  Badge,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@dmb/ui-kit"

import { TAGS, USERS, type FeedFilters, type Tag } from "./message"

// Sentinel for the user dropdown's "show everyone" option — selecting it clears
// the owner filter rather than filtering to a user named "all".
const ALL_USERS = "all"

/**
 * The filter sidebar (F5/F6/F7) — presentational, laid out to the reference
 * design's desktop `FILTERS` rail: a borderless column on the gray page, with a
 * `clear` affordance, tag chips, a user dropdown, and a stacked date range. It
 * reports changes through `onFilterChange({ [field]: values })` and knows nothing
 * about the URL — that lives in the container (app/feed/feed-filter-bar.tsx),
 * the same seam @dmb/auth uses to keep `next/*` out of the feature package.
 *
 * Tags stay multi-select (checkboxes that read as buttons — the accent-filled
 * `Badge` is the pressed state); the owner filter is a single-select dropdown per
 * the design.
 */
export function FeedFilterPanel({
  value,
  onFilterChange,
}: {
  value: FeedFilters
  onFilterChange: (patch: Partial<FeedFilters>) => void
}) {
  const selectedTags = value.tag ?? []
  const currentUser = value.user?.[0] ?? ALL_USERS

  function toggleTag(tag: Tag) {
    const next = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag]
    onFilterChange({ tag: next.length > 0 ? next : undefined })
  }

  function clearAll() {
    onFilterChange({ tag: undefined, user: undefined, from: undefined, to: undefined })
  }

  return (
    <aside className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-[13px] font-bold tracking-[0.1em]">FILTERS</h2>
        <button
          type="button"
          onClick={clearAll}
          className="cursor-pointer text-[12px] text-muted-foreground underline"
        >
          clear
        </button>
      </div>

      <div>
        <FilterLabel>Tag</FilterLabel>
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
      </div>

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
    </aside>
  )
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-[10px] font-mono text-[11px] font-bold tracking-[0.08em] text-muted-foreground uppercase">
      {children}
    </div>
  )
}
