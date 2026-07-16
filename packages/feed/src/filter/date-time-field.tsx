"use client"

import * as React from "react"
import { Suspense } from "react"
import { format } from "date-fns"
import { ChevronDownIcon } from "lucide-react"

import {
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

// The calendar is the heaviest dep the app ships, so it's code-split and only
// downloaded on first popover open. Imported from the module (the barrel would
// pull the whole kit into the chunk); React.lazy, not next/dynamic, so the
// package stays framework-agnostic.
const Calendar = React.lazy(() =>
  import("@dmb/ui-kit/components/calendar").then((m) => ({ default: m.Calendar }))
)

// An untouched time means the whole day: 00:00:00.000 → 23:59:59.999 keeps both
// bounds inclusive.
const EDGE = {
  start: { time: "00:00:00", ms: 0 },
  end: { time: "23:59:59", ms: 999 },
} as const

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

/**
 * A bare `YYYY-MM-DD` (an older or hand-typed link) means the whole *local* day;
 * anything unparseable reads as unset, matching the server, which ignores it.
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
 * One end of the date range. The controls show local wall-clock but commit a UTC
 * instant — only the client knows the viewer's offset. The time commits on blur,
 * not change: `type="time"` fires per segment, so committing on change would
 * spend three navigations on one "13:30:45".
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

  const id = React.useId()
  const dateId = `${id}-date`
  const timeId = `${id}-time`

  const selected = parseBound(value, edge)

  // A commit only lands on the URL after the ~1.2s latency, so mid-edit the
  // input holds a draft rather than snapping back under the caret.
  const [draft, setDraft] = React.useState<string | null>(null)

  const [committed, setCommitted] = React.useState(value)
  if (value !== committed) {
    setCommitted(value)
    setDraft(null)
  }

  const committedTime = selected ? format(selected, "HH:mm:ss") : EDGE[edge].time
  const time = draft ?? committedTime

  function commit(day: Date | undefined, at: string) {
    if (!day) return onChange(undefined)
    const [h, m, s] = at.split(":").map(Number)
    const local = new Date(day)
    local.setHours(h || 0, m || 0, s || 0, EDGE[edge].ms)
    onChange(local.toISOString())
  }

  // An array, not one `{ before, after }` matcher — that means *between*.
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
            {/* Fallback at the calendar's footprint, so the popover doesn't snap
                when the lazy chunk lands. */}
            <Suspense
              fallback={
                <div
                  aria-busy
                  aria-label="Loading calendar"
                  className="h-[298px] w-[251px]"
                />
              }
            >
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
            </Suspense>
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
            if (draft === null || draft === committedTime) return setDraft(null)
            commit(selected, draft)
          }}
          className="appearance-none px-2 [&::-webkit-calendar-picker-indicator]:hidden"
        />
      </Field>
    </FieldGroup>
  )
}
