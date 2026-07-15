import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Button } from "@dmb/ui-kit"

import { getSession } from "../(auth)/session"
import { logoutAction } from "../(auth)/logout/actions"

export const metadata: Metadata = {
  title: "Feed — Dispatch",
}

/**
 * Dynamic (reads the session cookie). Placeholder: it proves the auth loop —
 * login → redirect here → greeted by name → log out → back to /login — but the
 * feed itself, its filters, and the composer land with the backend (ADR-001).
 *
 * The `!session` guard here is a stopgap; the real optimistic redirect belongs
 * in proxy.ts (ADR-003), which is not built yet.
 */
export default async function FeedPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[13px] font-bold tracking-[0.16em] uppercase">
          ◆ Dispatch
        </span>
        <form action={logoutAction}>
          <Button type="submit" variant="outline" size="sm">
            LOG OUT
          </Button>
        </form>
      </div>

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
