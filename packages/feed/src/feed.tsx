import { Avatar, AvatarFallback, Badge } from "@dmb/ui-kit"

import { type FeedMessage } from "./message"

/**
 * The feed list (F4) — presentational. It takes already-fetched, already-filtered
 * data and renders it; it does no fetching and holds no state, so it stays a
 * Server Component and never ships to the client. Virtualization for 1000+ rows
 * (B2) and infinite scroll (ADR-004) wrap this later without changing its shape —
 * which is the whole point of keeping the data/UI split clean here.
 */
export function Feed({ data }: { data: FeedMessage[] }) {
  return (
    <ul className="flex flex-col gap-5">
      {data.map((message) => (
        <li key={message.id}>
          <MessageCard message={message} />
        </li>
      ))}
    </ul>
  )
}

/**
 * Layout measured from the reference design (the selected annotation): a 3px
 * ink-bordered white tile with 18px padding and — unlike the composer — **no
 * shadow**; only the composer form is raised. Header is an avatar tile + name /
 * @handle beside the relative time; the tag sits on its own row beneath the body.
 */
function MessageCard({ message }: { message: FeedMessage }) {
  const { author } = message

  return (
    <article className="border-[3px] border-ink bg-surface p-[18px]">
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-[10px]">
          <Avatar>
            <AvatarFallback>{author.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-sans text-[15px] font-bold">{author.name}</div>
            <div className="text-[12px] text-muted-foreground">@{author.handle}</div>
          </div>
        </div>
        <time
          dateTime={message.createdAt}
          className="text-[12px] text-muted-foreground"
        >
          {timeAgo(message.createdAt)}
        </time>
      </header>

      <p className="mt-[14px] font-sans text-[16px] leading-[1.5] break-words">
        {message.body}
      </p>

      <div className="mt-4">
        <Badge variant="outline">{message.tag}</Badge>
      </div>
    </article>
  )
}

/** Compact relative time — "18m", "3h", "2d" — as the design shows it. */
function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}
