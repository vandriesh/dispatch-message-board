import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Feed — Dispatch",
}

/**
 * Placeholder. This is the redirect target after login, so it has to exist — but
 * the feed itself, and the session read that will greet the user by name, land
 * with the backend (ADR-001). Deliberately not faking a session here.
 */
export default function FeedPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-16">
      <span className="font-mono text-[13px] font-bold tracking-[0.16em] uppercase">
        ◆ Dispatch
      </span>
      <h1 className="font-sans text-4xl font-bold tracking-tight">Welcome</h1>
      <p className="text-muted-foreground">
        You are logged in. The feed, its filters, and the composer are not wired yet — the
        mock API and session come next.
      </p>
    </main>
  )
}
