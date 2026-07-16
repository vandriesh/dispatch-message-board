import { z } from "zod"

/*
 * The framework-agnostic core of login. Deliberately NOT a `"use client"`
 * module: the schema and helpers are imported by both the client form and the
 * Server Action — in a client module, server code would receive
 * client-reference stubs instead of functions.
 */

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

export type LoginValues = z.infer<typeof loginSchema>

// Just `{ id, email }` — all the session cookie stores, all any reader uses.
export type SessionUser = {
  id: string
  email: string
}

export const INVALID_CREDENTIALS = "Incorrect user or password"

// Only errors travel back from the action: the form keeps the typed email in
// local state, and the password is deliberately never carried back.
export type LoginState = {
  fieldErrors?: { email?: string; password?: string }
  formError?: string
}

/** The shape `useActionState` drives — a Server Action satisfies it. */
export type LoginAction = (
  prevState: LoginState,
  formData: FormData
) => Promise<LoginState>

/** Collapse a `loginSchema` failure into per-field messages (first wins). */
function fieldErrorsFrom(
  error: z.ZodError<LoginValues>
): NonNullable<LoginState["fieldErrors"]> {
  const fieldErrors: NonNullable<LoginState["fieldErrors"]> = {}
  for (const issue of error.issues) {
    const key = issue.path[0]
    if ((key === "email" || key === "password") && !fieldErrors[key]) {
      fieldErrors[key] = issue.message
    }
  }
  return fieldErrors
}

/**
 * The one validation routine for a login submission. The client gate and the
 * Server Action both call this same function, so the two sites can't drift.
 */
export function parseLogin(
  formData: FormData
): { ok: true; data: LoginValues } | { ok: false; state: LoginState } {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })
  if (!parsed.success) {
    return { ok: false, state: { fieldErrors: fieldErrorsFrom(parsed.error) } }
  }
  return { ok: true, data: parsed.data }
}

/**
 * The mock user store; convention: password == email. Replace the body with a
 * real lookup and every caller keeps working.
 */
export function verifyCredentials({
  email,
  password,
}: LoginValues): SessionUser | null {
  if (email !== password) return null
  return { id: `u_${email.split("@")[0]}`, email }
}
