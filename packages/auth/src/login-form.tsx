"use client"

import * as React from "react"
import { z } from "zod"
import {
  Button,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
} from "@dmb/ui-kit"

/* -------------------------------------------------------------------------- *
 * Contract
 *
 * Types are defined where the data is born (see CLAUDE.md) — the login payload
 * and the session it returns are born here, so they are exported from here. The
 * route handler that eventually serves POST /api/session imports this schema
 * rather than redeclaring it, which is what keeps client and server validation
 * from drifting apart.
 * -------------------------------------------------------------------------- */

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

export type LoginValues = z.infer<typeof loginSchema>

export type SessionUser = {
  id: string
  email: string
  name: string
  handle: string
}

/** What the login endpoint returns on 4xx. */
export type LoginError = { error: string }

export const INVALID_CREDENTIALS = "Incorrect user or password"

/**
 * POST the credentials. Plain `fetch`, deliberately: it is what lets this be
 * tested with MSW exactly as it would be in any non-Next app. Nothing in this
 * package imports from `next/*`.
 */
export async function login(values: LoginValues): Promise<SessionUser> {
  const res = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  })

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as LoginError | null
    throw new Error(body?.error ?? INVALID_CREDENTIALS)
  }

  return (await res.json()) as SessionUser
}

/* -------------------------------------------------------------------------- *
 * Form
 * -------------------------------------------------------------------------- */

export type LoginFormProps = {
  /**
   * Called once the session exists. The *route* decides what "go to the app"
   * means — this package must not import next/navigation, or it could no longer
   * be rendered in a plain jsdom test without mocking the App Router.
   */
  onSuccess?: (user: SessionUser) => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [pending, setPending] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = React.useState<
    Partial<Record<keyof LoginValues, string>>
  >({})

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const form = new FormData(event.currentTarget)
    const parsed = loginSchema.safeParse({
      email: form.get("email"),
      password: form.get("password"),
    })

    if (!parsed.success) {
      const { fieldErrors: errors } = z.flattenError(parsed.error)
      setFieldErrors({
        email: errors.email?.[0],
        password: errors.password?.[0],
      })
      return
    }

    setFieldErrors({})
    setPending(true)

    try {
      onSuccess?.(await login(parsed.data))
    } catch (error) {
      setFormError(error instanceof Error ? error.message : INVALID_CREDENTIALS)
    } finally {
      setPending(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex w-full max-w-md flex-col gap-6"
    >
      <div className="flex flex-col gap-1">
        <h1 className="font-sans text-[26px] leading-none font-bold tracking-[-0.02em]">
          Log in
        </h1>
        <p className="text-[13px] text-muted-foreground">
          Use a seeded account to continue.
        </p>
      </div>

      {formError ? (
        <p
          role="alert"
          className="border-[2.5px] border-destructive bg-destructive/10 px-4 py-3 font-mono text-[13px] font-bold text-destructive"
        >
          {formError}
        </p>
      ) : null}

      <FieldGroup>
        <Field data-invalid={fieldErrors.email ? true : undefined}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="ada@dispatch.dev"
            aria-invalid={fieldErrors.email ? true : undefined}
          />
          {fieldErrors.email ? <FieldError>{fieldErrors.email}</FieldError> : null}
        </Field>

        <Field data-invalid={fieldErrors.password ? true : undefined}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={fieldErrors.password ? true : undefined}
          />
          {fieldErrors.password ? <FieldError>{fieldErrors.password}</FieldError> : null}
        </Field>
      </FieldGroup>

      <Button type="submit" size="xl" disabled={pending}>
        {pending ? "SIGNING IN…" : "LOG IN →"}
      </Button>
    </form>
  )
}
