"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import {
  INVALID_CREDENTIALS,
  parseLogin,
  verifyCredentials,
  type LoginState,
} from "@dmb/auth"

import { createSession } from "../session"

// Re-validates with the same `parseLogin` the client gate runs — the client's
// check is a courtesy; this is the boundary that holds against a direct hit.
export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const result = parseLogin(formData)
  if (!result.ok) return result.state

  const user = verifyCredentials(result.data)
  if (!user) return { formError: INVALID_CREDENTIALS }

  await createSession(user)
  // Refresh the root layout so its session-gated top bar appears on redirect.
  revalidatePath("/", "layout")
  redirect("/feed")
}
