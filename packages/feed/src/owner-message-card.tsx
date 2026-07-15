"use client"

import * as React from "react"
import { Badge, Button, Textarea } from "@dmb/ui-kit"

import { type OwnedMessage } from "./rbac"
import { CardHeader, SimpleCard } from "./simple-card"

const MAX = 240

/**
 * The mutation callbacks the owner card invokes. Structural on purpose: the
 * concrete implementations are Server Actions that live in the app (they need the
 * session cookie), handed in as props — the feature package never imports from
 * `app/`, so the dependency only ever points one way. `edit`/`remove` resolve to
 * `{ ok }` so the card can surface the server's verdict; the server's `isOwner`
 * re-check is the real gate, not the button's visibility.
 */
export type MessageActions = {
  edit: (id: string, body: string) => Promise<{ ok: boolean; error?: string }>
  remove: (id: string) => Promise<{ ok: boolean; error?: string }>
}

/**
 * The author's own card — the one place the edit/delete state machine lives. It
 * renders one of three presentational shapes and owns nothing else: `EditCard`
 * while editing, otherwise `SimpleCard` (variant "owner") with either the resting
 * EDIT/DELETE controls or the two-step delete confirmation in its actions slot.
 * Non-authors never reach here — the list renders a plain `SimpleCard` for them.
 *
 * `body` is held locally so an edit shows immediately and a delete drops the row,
 * which also covers the client-appended LoadMore rows that `revalidatePath` can't
 * reach.
 */
export function OwnerMessageCard({
  message,
  actions,
}: {
  message: OwnedMessage
  actions: MessageActions
}) {
  const [body, setBody] = React.useState(message.body)
  const [editing, setEditing] = React.useState(false)
  const [confirmingDelete, setConfirmingDelete] = React.useState(false)
  const [deleted, setDeleted] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  if (deleted) return null

  async function save(next: string) {
    setPending(true)
    setError(null)
    const res = await actions.edit(message.id, next)
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? "Could not save the edit.")
      return
    }
    setBody(next)
    setEditing(false)
  }

  async function confirmRemove() {
    setPending(true)
    setError(null)
    const res = await actions.remove(message.id)
    if (!res.ok) {
      setPending(false)
      setConfirmingDelete(false)
      setError(res.error ?? "Could not delete.")
      return
    }
    setDeleted(true)
  }

  if (editing) {
    return (
      <EditCard
        message={{ ...message, body }}
        pending={pending}
        error={error}
        onSave={save}
        onCancel={() => {
          setEditing(false)
          setError(null)
        }}
      />
    )
  }

  return (
    <SimpleCard message={{ ...message, body }} variant="owner" error={error}>
      {confirmingDelete ? (
        // Delete is destructive and easy to hit by accident, so it takes two
        // steps: the resting DELETE arms this, and this row commits it.
        <>
          <Button
            variant="destructive"
            size="xs"
            onClick={confirmRemove}
            disabled={pending}
          >
            {pending ? "DELETING…" : "YES, I'M SURE. DELETE."}
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={() => setConfirmingDelete(false)}
            disabled={pending}
          >
            CANCEL
          </Button>
        </>
      ) : (
        <>
          <Button
            variant="outline"
            size="xs"
            onClick={() => {
              setError(null)
              setEditing(true)
            }}
            disabled={pending}
          >
            EDIT
          </Button>
          <Button
            variant="destructive"
            size="xs"
            onClick={() => {
              setError(null)
              setConfirmingDelete(true)
            }}
            disabled={pending}
          >
            DELETE
          </Button>
        </>
      )}
    </SimpleCard>
  )
}

/**
 * The editing layout — a self-contained form owning only its draft. It calls
 * `onSave` with the trimmed body; the async work and error live in the parent.
 * Shares `CardHeader` with SimpleCard so the two stay visually identical.
 */
function EditCard({
  message,
  pending,
  error,
  onSave,
  onCancel,
}: {
  message: Pick<OwnedMessage, "author" | "createdAt" | "tag" | "body">
  pending: boolean
  error: string | null
  onSave: (body: string) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = React.useState(message.body)
  const over = draft.length > MAX
  const empty = draft.trim().length === 0

  return (
    <article className="border-[3px] border-ink bg-surface p-[18px]">
      <CardHeader message={message} variant="owner" />

      <div className="mt-[14px] flex flex-col gap-2">
        <Textarea
          aria-label="Edit message"
          value={draft}
          maxLength={MAX}
          disabled={pending}
          onChange={(event) => setDraft(event.target.value)}
        />
        <span
          aria-live="polite"
          className={
            over
              ? "self-end font-mono text-[13px] text-destructive"
              : "self-end font-mono text-[13px] text-muted-foreground"
          }
        >
          {draft.length}/{MAX}
        </span>
      </div>

      {error && (
        <p role="alert" className="mt-2 font-mono text-[13px] text-destructive">
          {error}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between gap-2">
        <Badge variant="default">{message.tag}</Badge>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="xs"
            onClick={onCancel}
            disabled={pending}
          >
            CANCEL
          </Button>
          <Button
            variant="default"
            size="xs"
            onClick={() => onSave(draft.trim())}
            disabled={pending || empty || over}
          >
            {pending ? "SAVING…" : "SAVE"}
          </Button>
        </div>
      </div>
    </article>
  )
}
