"use client"

import * as React from "react"
import { format } from "date-fns"
import { ChevronDownIcon } from "lucide-react"

import {
  Calendar,
  Field,
  FieldGroup,
  FieldLabel,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  cn,
  inputVariants,
} from "@dmb/ui-kit"

/**
 * What an untouched time means at each end of the range. Picking only a day still
 * covers all of it — the behaviour these bounds had when they were plain date
 * inputs — and the millisecond keeps `to` inclusive of the second it names.
 */
const EDGE = {
  start: { time: "00:00:00", ms: 0 },
  end: { time: "23:59:59", ms: 999 },
} as const

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

/**
 * Read a bound off the URL as the local wall-clock the controls display.
 *
 * A bare `YYYY-MM-DD` (an older link, or a hand-typed one) means the whole day,
 * so it resolves to this end's edge of the *local* day — `new Date("2026-07-15")`
 * would read it as UTC midnight and render as 03:00 east of Greenwich, which
 * looks like a narrow filter rather than the whole day it asks for.
 *
 * Anything unparseable reads as unset: the URL is user-editable and the server
 * ignores a bound it can't parse, so the rail must agree rather than hand an
 * Invalid Date to `format`, which throws.
 */
export function parseBound(
  value: string | undefined,
  edge: keyof typeof EDGE
): Date | undefined {
  if (!value) return undefined

  if (DATE_ONLY.test(value)) {
    const [y, m, d] = value.split("-").map(Number)
    const { time, ms } = EDGE[edge]
    const [hh, mm, ss] = time.split(":").map(Number)
    return new Date(y, m - 1, d, hh, mm, ss, ms)
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

/**
 * One end of the date range (F6) — a date popover beside a time input, the pair
 * committing a single absolute instant.
 *
 * Both controls read and write **local** wall-clock while the committed value is
 * UTC (`toISOString()`): picking 10:30 means the caller's 10:30. That conversion
 * has to happen here, on the client, because it's the only place the viewer's
 * offset is known — the server would resolve a floating "10:30" against its own
 * zone (UTC on Vercel) and quietly answer a different question.
 *
 * Each control commits once it has a whole intent to report. For the date that's
 * the pick. For the time it's the **blur**: `type="time"` fires per segment, so
 * committing on change would spend three URL writes on one "13:30:45" — each a
 * server render, a ~1.2s latency, and a `FeedClient` remount — and the input
 * would snap back between them. So it holds a draft until focus leaves.
 *
 * With no date the time input is disabled: a time alone filters nothing, so there
 * would be nothing to commit.
 *
 * The calendar is the one thing here that costs real bytes (`react-day-picker` +
 * `date-fns`, the heaviest dep in the app) — and now that it sits behind a
 * popover, it's the `next/dynamic` candidate the README suggests.
 */
export function DateTimeField({
  label,
  value,
  edge,
  min,
  max,
  onChange,
}: {
  label: string
  value?: string
  edge: keyof typeof EDGE
  /** Earliest selectable day — the other end of the range. */
  min?: Date
  /** Latest selectable day — the other end of the range. */
  max?: Date
  onChange: (instant: string | undefined) => void
}) {
  const [open, setOpen] = React.useState(false)

  // Four of these are mounted at once (From/To × the desktop rail and the mobile
  // panel), so the label targets need to be unique per instance.
  const id = React.useId()
  const dateId = `${id}-date`
  const timeId = `${id}-time`

  const selected = parseBound(value, edge)

  // What's typed but not yet committed. The input can't read straight off the
  // URL: a commit only lands after the latency, so mid-edit the controlled value
  // would still be the old one and snap back under the caret.
  const [draft, setDraft] = React.useState<string | null>(null)

  // Drop the draft once the URL catches up (or moves for reasons of its own — a
  // shared link, Back). Adjusting during render rather than from an effect: no
  // second pass, and no cascade to re-sync.
  const [committed, setCommitted] = React.useState(value)
  if (value !== committed) {
    setCommitted(value)
    setDraft(null)
  }

  const committedTime = selected ? format(selected, "HH:mm:ss") : EDGE[edge].time
  const time = draft ?? committedTime

  /** Fold the local day and local time into the instant that goes on the URL. */
  function commit(day: Date | undefined, at: string) {
    if (!day) return onChange(undefined)
    const [h, m, s] = at.split(":").map(Number)
    const local = new Date(day)
    local.setHours(h || 0, m || 0, s || 0, EDGE[edge].ms)
    onChange(local.toISOString())
  }

  // An array, not one object: `{ before, after }` in a single matcher reads as
  // the interval *between* the two, which is the inverse of what's wanted.
  const disabledDays = [
    ...(min ? [{ before: min }] : []),
    ...(max ? [{ after: max }] : []),
  ]

  return (
    <FieldGroup className="flex-row gap-2">
      <Field className="min-w-0 flex-1">
        <FieldLabel htmlFor={dateId}>{label}</FieldLabel>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            id={dateId}
            render={<button type="button" />}
            className={cn(
              inputVariants({ inputSize: "sm" }),
              "flex items-center justify-between gap-2 text-left font-normal",
              !selected && "text-muted-foreground"
            )}
          >
            {selected ? format(selected, "d MMM yyyy") : "Any"}
            <ChevronDownIcon className="size-4 shrink-0" />
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={selected}
              defaultMonth={selected}
              captionLayout="dropdown"
              disabled={disabledDays}
              onSelect={(day) => {
                commit(day, time)
                setOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>
      </Field>

      <Field className="w-[106px] shrink-0">
        <FieldLabel htmlFor={timeId}>Time</FieldLabel>
        <Input
          type="time"
          id={timeId}
          step="1"
          inputSize="sm"
          value={time}
          disabled={!selected}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => {
            // Nothing typed, or typed back to what's already committed — either
            // way there's no filter change to spend a navigation on.
            if (draft === null || draft === committedTime) return setDraft(null)
            commit(selected, draft)
          }}
          className="appearance-none px-2 [&::-webkit-calendar-picker-indicator]:hidden"
        />
      </Field>
    </FieldGroup>
  )
}
