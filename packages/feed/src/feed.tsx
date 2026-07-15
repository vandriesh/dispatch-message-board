"use client"

import { OwnerMessageCard } from "./owner-message-card"
import { type FeedRow } from "./rbac"
import { SimpleCard } from "./simple-card"

/**
 * The feed list (F4) — presentational over already-fetched, already-filtered rows.
 * It holds no fetch state; the client container above it (`FeedClient`) owns the
 * query and the optimistic overlay and passes the mutation handlers down. Each row
 * branches once on the server-stamped `owner` flag (rbac): the author gets the
 * interactive `OwnerMessageCard` (edit/delete), everyone else a plain `SimpleCard`
 * with no controls. Virtualization for 1000+ rows (B2) wraps this later without
 * changing its shape.
 */
export function Feed({
  data,
  rowError,
  onEdit,
  onDelete,
}: {
  data: FeedRow[]
  rowError?: { id: string; message: string } | null
  onEdit: (id: string, body: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <ul className="flex flex-col gap-5">
      {data.map((message) => (
        <li key={message.id}>
          {message.owner ? (
            <OwnerMessageCard
              message={message}
              error={rowError?.id === message.id ? rowError.message : null}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ) : (
            <SimpleCard message={message} />
          )}
        </li>
      ))}
    </ul>
  )
}
