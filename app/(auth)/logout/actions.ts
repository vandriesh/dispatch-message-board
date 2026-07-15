"use server"

import { redirect } from "next/navigation"

import { clearSession } from "../session"

/**
 * Log out: clear the session cookie server-side and return to /login. Invoked
 * from a plain `<form action={logoutAction}>`, so it works without client JS.
 */
export async function logoutAction(): Promise<void> {
  await clearSession()
  redirect("/login")
}
