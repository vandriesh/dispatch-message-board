"use client"

import * as React from "react"
import { Badge, Button, Textarea } from "@dmb/ui-kit"

import { type FeedRow, type OwnedMessage } from "./rbac"
import { CardHeader, SimpleCard } from "./simple-card"

const MAX = 240

/**
 * The author's own card: the edit / two-step-delete UI state machine. The data
 * changes are optimistic and live one level up — this card only fires the
 * intent; a pending row shows dimmed with no controls until the server answers.
 */
export function OwnerMessageCard({
  message,
  error,
  onEdit,
  onDelete,
}: {
  message: FeedRow
  error?: string | null
  onEdit: (id: string, body: string) => void
  onDelete: (id: string) => void
}) {
  const [editing, setEditing] = React.useState(false)
  const [confirmingDelete, setConfirmingDelete] = React.useState(false)

  if (message.pending) {
    return <SimpleCard message={message} variant="owner" pending />
  }

  if (editing) {
    return (
      <EditCard
        message={message}
        onSave={(next) => {
          onEdit(message.id, next)
          setEditing(false)
        }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <SimpleCard message={message} variant="owner" error={error}>
      {confirmingDelete ? (
        // Delete is destructive and easy to hit by accident, so it takes two
        // steps: the resting DELETE arms this, and this row commits it.
        <>
          <Button
            variant="destructive"
            size="xs"
            onClick={() => {
              onDelete(message.id)
              setConfirmingDelete(false)
            }}
          >
            YES, DELETE
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={() => setConfirmingDelete(false)}
          >
            CANCEL
          </Button>
        </>
      ) : (
        <>
          <Button variant="outline" size="xs" onClick={() => setEditing(true)}>
            EDIT
          </Button>
          <Button
            variant="destructive"
            size="xs"
            onClick={() => setConfirmingDelete(true)}
          >
            DELETE
          </Button>
        </>
      )}
    </SimpleCard>
  )
}

// Owns only its draft, so typing re-renders this row and not the other 999.
// Body-only by design: the tag is fixed at post time.
function EditCard({
  message,
  onSave,
  onCancel,
}: {
  message: Pick<OwnedMessage, "author" | "createdAt" | "tag" | "body">
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
          autoFocus
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

      <div className="mt-4 flex items-center justify-between gap-2">
        <Badge variant="default">{message.tag}</Badge>
        <div className="flex gap-2">
          <Button variant="ghost" size="xs" onClick={onCancel}>
            CANCEL
          </Button>
          <Button
            variant="default"
            size="xs"
            onClick={() => onSave(draft.trim())}
            disabled={empty || over}
          >
            SAVE
          </Button>
        </div>
      </div>
    </article>
  )
}
