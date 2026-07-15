import { z } from "zod"

/* -------------------------------------------------------------------------- *
 * Contract — the framework-agnostic core of login.
 *
 * Deliberately NOT a `"use client"` module. The schema and the pure functions
 * below are imported by *both* sides: the client form (`login-form.tsx`) and the
 * Server Action (`app/(auth)/login/actions.ts`). If they lived in the
 * `"use client"` form module, server code importing them would receive
 * client-reference stubs — `loginSchema.safeParse` would not be a function at
 * runtime on the server. Keeping the contract in a plain module is what lets one
 * schema genuinely serve both validation sites (see ADR-003).
 *
 * Types are defined where the data is born (CLAUDE.md): the login payload, the
 * session it yields, and the form ⇄ action state contract are all born here.
 * -------------------------------------------------------------------------- */

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

export type LoginValues = z.infer<typeof loginSchema>

/**
 * The authenticated user — the result of a successful credential check, and the
 * value persisted in the session. Deliberately just `{ id, email }`: that is all
 * `createSession` writes to the cookie and all any reader (e.g. the feed) uses.
 * A `handle`/display name belongs here only once the messages feature actually
 * renders an author — added then, where a consumer defines what it needs.
 */
export type SessionUser = {
  id: string
  email: string
}

export const INVALID_CREDENTIALS = "Incorrect user or password"

/**
 * The state passed back from the action to the form, via `useActionState`.
 * Only errors travel this way: field-level messages from validation, or a single
 * form-level message for a rejected login. The typed email is *not* echoed here —
 * the form controls it locally (see `login-form.tsx`), so it survives a rejected
 * submit without a round-trip; the password is deliberately never carried back.
 */
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
 * The one validation routine for a login submission, read straight from its
 * FormData. Both sides call *this* — the client gate (to spare the server an
 * obviously-bad payload) and the Server Action (which can't trust the client) —
 * so "the client and the server do the same thing" is literally the same
 * function, not two copies that drift. Both still run it; there is just a single
 * schema and a single error shape.
 *
 * Returns a discriminated result: `data` (validated) on success, or the exact
 * `LoginState` the form should render on failure.
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
 * The mock user store, standing in for real user management (O4).
 *
 * Framework-agnostic and pure, so it is unit-testable with nothing — no Next, no
 * network. Convention: password == email. Replace the body with a real lookup and
 * every caller keeps working.
 */
export function verifyCredentials({
  email,
  password,
}: LoginValues): SessionUser | null {
  if (email !== password) return null
  return { id: `u_${email.split("@")[0]}`, email }
}
