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

import { TAGS, type MessageDraft, type Tag } from "./message"

const MAX = 240

/**
 * Submit clears the form immediately — the post is optimistic, so the row shows
 * in the feed at once; the mutation and its rollback live one level up.
 */
export function Composer({
  onPost,
  error,
  restore,
}: {
  onPost: (draft: MessageDraft) => void
  error?: string | null
  restore?: MessageDraft | null
}) {
  const [body, setBody] = React.useState("")
  const [tag, setTag] = React.useState<Tag>(TAGS[0])
  const over = body.length > MAX
  const canPost = body.trim().length > 0 && !over

  // A rejected post is handed back via `restore` so the text isn't lost. Only
  // refill when the field is empty, so a message typed during the in-flight
  // window is never clobbered; `body` is read through a ref so the refill
  // effect keys on `restore` alone.
  const bodyRef = React.useRef(body)
  React.useEffect(() => {
    bodyRef.current = body
  }, [body])
  React.useEffect(() => {
    if (restore && bodyRef.current.trim().length === 0) {
      setBody(restore.body)
      setTag(restore.tag)
    }
  }, [restore])

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!canPost) return
    onPost({ body: body.trim(), tag })
    setBody("")
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

      {error && (
        <p role="alert" className="font-mono text-[13px] text-destructive">
          {error}
        </p>
      )}
    </form>
  )
}
