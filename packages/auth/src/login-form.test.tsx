import * as React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  INVALID_CREDENTIALS,
  LoginForm,
  verifyCredentials,
  type SessionUser,
} from "@dmb/auth"
// `LoginAction` is the form's internal prop contract, not public API — the test
// lives in the package, so it imports it from the module directly.
import type { LoginAction } from "./login-contract"

const GOOD_USER = "gooduser@dispatch.dev"

/**
 * The fake action deliberately does NOT validate — validation is the form's own
 * client-side gate, so a non-validating action is how we prove the gate stops a
 * bad payload before the action is ever called. The real Server Action's
 * cookie/redirect glue is Next-specific and belongs to an E2E test.
 */
function fakeServerAction(onUser: (user: SessionUser) => void): LoginAction {
  return async (_prev, formData) => {
    const user = verifyCredentials({
      email: String(formData.get("email")),
      password: String(formData.get("password")),
    })
    if (!user) return { formError: INVALID_CREDENTIALS }
    onUser(user)
    return {}
  }
}

/** Stands in for the route: on success the real app redirects to /feed; here we
 *  swap to the protected view, mirroring what the redirect would reveal. */
function AuthFlow() {
  const [user, setUser] = React.useState<SessionUser | null>(null)
  if (user) return <h1>Welcome {user.email}</h1>
  return <LoginForm action={fakeServerAction(setUser)} />
}

async function submitLogin(email: string, password: string) {
  const user = userEvent.setup()
  if (email) await user.type(screen.getByLabelText(/email/i), email)
  if (password) await user.type(screen.getByLabelText(/password/i), password)
  await user.click(screen.getByRole("button", { name: /log in/i }))
}

describe("verifyCredentials", () => {
  it("accepts a seeded account (password == email)", () => {
    expect(verifyCredentials({ email: GOOD_USER, password: GOOD_USER })).toEqual({
      id: "u_gooduser",
      email: GOOD_USER,
    })
  })

  it("rejects a wrong password", () => {
    expect(verifyCredentials({ email: GOOD_USER, password: "nope" })).toBeNull()
  })
})

describe("login form", () => {
  it("lets a valid user through to the protected view", async () => {
    render(<AuthFlow />)

    await submitLogin(GOOD_USER, GOOD_USER)

    expect(
      await screen.findByRole("heading", { name: `Welcome ${GOOD_USER}` })
    ).toBeInTheDocument()
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument()
  })

  it("shows an error and stays put when the password is wrong", async () => {
    render(<AuthFlow />)

    await submitLogin(GOOD_USER, "wrong-password")

    expect(await screen.findByRole("alert")).toHaveTextContent("Incorrect user or password")
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: /welcome/i })).not.toBeInTheDocument()
  })

  it("gates a bad payload on the client, sparing the server a round-trip", async () => {
    // A non-validating action: if the client gate leaks, `verifyCredentials`
    // would run and this spy would fire. It must not.
    const serverAction = vi.fn<LoginAction>(async () => ({}))
    render(<LoginForm action={serverAction} />)

    await submitLogin("not-an-email", "")

    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument()
    expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    expect(serverAction).not.toHaveBeenCalled()
  })
})
