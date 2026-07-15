"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { clearSession } from "../session"

/**
 * Log out: clear the session cookie server-side and return to /login. Invoked
 * from a plain `<form action={logoutAction}>`, so it works without client JS.
 *
 * `revalidatePath("/", "layout")` forces the root layout to re-read the (now
 * cleared) cookie, so its session-gated top bar disappears on this transition
 * rather than lingering until a full reload.
 */
export async function logoutAction(): Promise<void> {
  await clearSession()
  revalidatePath("/", "layout")
  redirect("/login")
}
