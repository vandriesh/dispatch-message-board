"use server"

import { redirect } from "next/navigation"

import {
  INVALID_CREDENTIALS,
  parseLogin,
  verifyCredentials,
  type LoginState,
} from "@dmb/auth"

import { createSession } from "../session"

/**
 * Server-side login. This is the Next-specific glue that @dmb/auth deliberately
 * does not contain: it validates the payload with `parseLogin` — the *same*
 * routine the client gate runs — then checks credentials, sets the session
 * cookie, and redirects, all on the server.
 *
 * Re-validating here rather than trusting the client is the point: the browser's
 * check is a UX nicety and a courtesy to the backend; this is the boundary that
 * actually holds against a direct hit.
 */
export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  // just to be safe and protect back-end from direct contact we parse again
  const result = parseLogin(formData)
  if (!result.ok) return result.state

  const user = verifyCredentials(result.data)
  if (!user) return { formError: INVALID_CREDENTIALS }

  await createSession(user)
  redirect("/feed")
}
