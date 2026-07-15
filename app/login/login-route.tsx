"use client"

import { useRouter } from "next/navigation"
import { LoginForm } from "@dmb/auth"

/**
 * The Next.js half of login, and deliberately the *only* half that knows Next
 * exists.
 *
 * @dmb/auth owns the form, the schema, and the request; it reports success
 * through `onSuccess` and has no opinion about routing. This file supplies the
 * one thing that is genuinely framework-specific — what "you're in" means — so
 * the feature package stays renderable in a plain jsdom test without an App
 * Router mock.
 */
export function LoginRoute() {
  const router = useRouter()

  return (
    <LoginForm
      onSuccess={() => {
        router.push("/feed")
        // Drop the login page from the back-stack cache so Back doesn't return
        // to a form the user has already used.
        router.refresh()
      }}
    />
  )
}
