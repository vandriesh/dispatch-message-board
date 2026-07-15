import { OwnerMessageCard, type MessageActions } from "./owner-message-card"
import { type OwnedMessage } from "./rbac"
import { SimpleCard } from "./simple-card"

/**
 * The feed list (F4) — presentational. It takes already-fetched, already-filtered
 * data and renders it; it does no fetching and holds no state, so it stays a
 * Server Component and never ships to the client. Each row branches once on the
 * server-stamped `owner` flag: the author gets the interactive `OwnerMessageCard`
 * client island (edit/delete), everyone else a plain `SimpleCard` with no controls
 * and nothing to hydrate. Virtualization for 1000+ rows (B2) and infinite scroll
 * (ADR-004) wrap this later without changing its shape.
 */
export function Feed({
  data,
  actions,
}: {
  data: OwnedMessage[]
  actions: MessageActions
}) {
  return (
    <ul className="flex flex-col gap-5">
      {data.map((message) => (
        <li key={message.id}>
          {message.owner ? (
            <OwnerMessageCard message={message} actions={actions} />
          ) : (
            <SimpleCard message={message} />
          )}
        </li>
      ))}
    </ul>
  )
}
