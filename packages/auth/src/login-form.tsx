"use client"

import { useActionState, useCallback } from "react"
import {
  Button,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
} from "@dmb/ui-kit"

import { parseLogin, type LoginAction, type LoginState } from "./login-contract"

const EMPTY: LoginState = {}

export function LoginForm({ action }: { action: LoginAction }) {
  const guardedAction = useCallback<LoginAction>(
    async (prev, formData) => {
      const result = parseLogin(formData)
      if (!result.ok) return result.state
      return action(prev, formData)
    },
    [action]
  )

  const [state, formAction, pending] = useActionState(guardedAction, EMPTY)

  return (
    <form action={formAction} noValidate className="flex w-full max-w-md flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-sans text-[26px] leading-none font-bold tracking-[-0.02em]">
          Log in
        </h1>
        <p className="text-[13px] text-muted-foreground">
          Use a seeded account to continue.
        </p>
      </div>

      {state.formError ? (
        <p
          role="alert"
          className="border-[2.5px] border-destructive bg-destructive/10 px-4 py-3 font-mono text-[13px] font-bold text-destructive"
        >
          {state.formError}
        </p>
      ) : null}

      <FieldGroup>
        <Field data-invalid={state.fieldErrors?.email ? true : undefined}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="ada@dispatch.dev"
            defaultValue=""
            aria-invalid={state.fieldErrors?.email ? true : undefined}
          />
          {state.fieldErrors?.email ? (
            <FieldError>{state.fieldErrors.email}</FieldError>
          ) : null}
        </Field>

        <Field data-invalid={state.fieldErrors?.password ? true : undefined}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            defaultValue=""
            aria-invalid={state.fieldErrors?.password ? true : undefined}
          />
          {state.fieldErrors?.password ? (
            <FieldError>{state.fieldErrors.password}</FieldError>
          ) : null}
        </Field>
      </FieldGroup>

      <Button type="submit" size="xl" disabled={pending}>
        {pending ? "SIGNING IN…" : "LOG IN →"}
      </Button>
    </form>
  )
}
