import { cookies } from "next/headers"

import type { SessionUser } from "@dmb/auth"

// A mock session: id + email in an httpOnly cookie. No signing, but the shape
// is real — swapping in a signed token is a change to this file alone.
const COOKIE = "dmb_session"
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export async function createSession(user: SessionUser): Promise<void> {
  const store = await cookies()
  store.set(COOKIE, JSON.stringify(user), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  })
}

export async function clearSession(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE)
}

export async function getSession(): Promise<SessionUser | null> {
  const raw = (await cookies()).get(COOKIE)?.value
  if (!raw) return null
  try {
    return JSON.parse(raw) as SessionUser
  } catch {
    return null
  }
}
