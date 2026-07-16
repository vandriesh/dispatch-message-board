"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { clearSession } from "../session"

// `revalidatePath("/", "layout")` forces the layout to re-read the cleared
// cookie, so the session-gated top bar disappears without a full reload.
export async function logoutAction(): Promise<void> {
  await clearSession()
  revalidatePath("/", "layout")
  redirect("/login")
}
