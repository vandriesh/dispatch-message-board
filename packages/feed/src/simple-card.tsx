import { type ReactNode } from "react"
import { Avatar, AvatarFallback, Badge } from "@dmb/ui-kit"

import { type FeedMessage } from "./message"

/**
 * The resting message card — pure presentation, no branching. It renders the
 * chrome (header, body, tag) and exposes an actions slot via `children`, so the
 * owner card can drop EDIT/DELETE (or the delete confirmation) in without
 * SimpleCard knowing anything about ownership. `variant="owner"` wears the accent
 * (yellow avatar + filled tag, F8); everyone else's posts render on surface.
 *
 * No `"use client"`: it holds no state, so the same component renders in the
 * Server-Component list for non-owners and inside the client owner card alike.
 *
 * Layout is measured from the reference design: a 3px ink-bordered white tile
 * with 18px padding and — unlike the composer — no shadow.
 */
export function SimpleCard({
  message,
  variant = "default",
  error,
  children,
}: {
  message: Pick<FeedMessage, "author" | "body" | "tag" | "createdAt">
  variant?: "owner" | "default"
  error?: string | null
  children?: ReactNode
}) {
  return (
    <article className="border-[3px] border-ink bg-surface p-[18px]">
      <CardHeader message={message} variant={variant} />

      <p className="mt-[14px] font-sans text-[16px] leading-[1.5] break-words">
        {message.body}
      </p>

      {error && (
        <p role="alert" className="mt-2 font-mono text-[13px] text-destructive">
          {error}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between gap-2">
        <Badge variant={variant === "owner" ? "default" : "outline"}>
          {message.tag}
        </Badge>
        {children && <div className="flex gap-2">{children}</div>}
      </div>
    </article>
  )
}

/**
 * The card header — avatar tile + name / @handle beside the relative time. Shared
 * by SimpleCard and the edit layout so the two can't drift. `variant` tints the
 * viewer's own avatar with the accent (F8).
 */
export function CardHeader({
  message,
  variant,
}: {
  message: Pick<FeedMessage, "author" | "createdAt">
  variant: "owner" | "default"
}) {
  const { author } = message
  return (
    <header className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-[10px]">
        <Avatar variant={variant === "owner" ? "accent" : "surface"}>
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
