"use client"

import * as React from "react"
import {
  Button,
  Field,
  FieldLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@dmb/ui-kit"

import { TAGS, type Tag } from "./message"

const MAX = 240

/**
 * The composer (F2). Tag is a single-select (one tag per message — O2); the body
 * is capped at 240. Submit is intentionally a no-op for now — this lands the form
 * and its guard rails; wiring `POST /api/messages` with an optimistic insert and
 * rollback (ADR-005) is the next step, and it stays framework-agnostic here just
 * like the login form, so it can be tested with MSW rather than a router mock.
 */
export function Composer() {
  const [body, setBody] = React.useState("")
  const [tag, setTag] = React.useState<Tag>(TAGS[0])
  const over = body.length > MAX
  const canPost = body.trim().length > 0 && !over

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    // TODO(F2): POST /api/messages, optimistic insert + rollback on failure (ADR-005).
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 border-[3px] border-ink bg-surface p-4 shadow-brutal-md"
    >
      <Field>
        <FieldLabel htmlFor="composer-body" className="sr-only">
          Message
        </FieldLabel>
        <Textarea
          id="composer-body"
          value={body}
          maxLength={MAX}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Say it in 240…"
        />
      </Field>

      <div className="flex items-center justify-between gap-3">
        <Select value={tag} onValueChange={(value) => setTag(value as Tag)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TAGS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-3">
          <span
            aria-live="polite"
            className={
              over
                ? "font-mono text-[13px] text-destructive"
                : "font-mono text-[13px] text-muted-foreground"
            }
          >
            {body.length}/{MAX}
          </span>
          <Button type="submit" disabled={!canPost}>
            POST
          </Button>
        </div>
      </div>
    </form>
  )
}
