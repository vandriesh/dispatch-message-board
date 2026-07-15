import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { getSession } from "@/app/(auth)/session"

export const metadata: Metadata = {
  title: "Feed — Dispatch",
}

/**
 * Dynamic (reads the session cookie). Placeholder: it proves the auth loop —
 * login → redirect here → greeted by name → log out → back to /login — but the
 * feed itself, its filters, and the composer land with the backend (ADR-001).
 *
 * The top bar (brand, avatar, LOG OUT) is rendered by the root layout whenever a
 * session exists (ADR-012). Auth-guarding is this page's own job: no shared
 * authenticated layout sits above it, so the `!session` redirect below is the
 * real gate, not just type-narrowing.
 */
export default async function FeedPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="font-sans text-4xl font-bold tracking-tight">
          Welcome {session.email}
        </h1>
        <p className="text-muted-foreground">
          You are logged in. The feed, its filters, and the composer are not wired yet — the
          mock API comes next.
        </p>
      </div>
    </main>
  )
}
