import * as React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest"

import { LoginForm, type SessionUser } from "@dmb/auth"

import { GOOD_USER, server, VILLAIN_USER } from "./login-form.mocks"

/**
 * The auth package owns its own MSW lifecycle. `onUnhandledRequest: "error"`
 * means an endpoint nobody mocked fails the run loudly — which is what lets the
 * validation test below assert the request was *never made*, not merely that it
 * failed.
 */
beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

/**
 * Stands in for the app's routing. In the real app, app/login/login-route.tsx
 * responds to `onSuccess` with `router.push("/feed")`; here we swap to the
 * protected view directly.
 *
 * That substitution is the whole point of the `onSuccess` seam: because @dmb/auth
 * never imports next/navigation, the login flow can be exercised end-to-end in
 * plain jsdom — real component, real fetch, real validation — with MSW answering
 * at the network layer and no App Router mock anywhere.
 */
function AuthFlow() {
  const [user, setUser] = React.useState<SessionUser | null>(null)

  if (user) {
    return <h1>Welcome {user.email}</h1>
  }

  return <LoginForm onSuccess={setUser} />
}

async function submitLogin(email: string, password: string) {
  const user = userEvent.setup()
  // user-event throws on an empty string, so an omitted field is simply left alone.
  if (email) await user.type(screen.getByLabelText(/email/i), email)
  if (password) await user.type(screen.getByLabelText(/password/i), password)
  await user.click(screen.getByRole("button", { name: /log in/i }))
}

describe("login", () => {
  it("lets a valid user through to the protected view", async () => {
    render(<AuthFlow />)

    await submitLogin(GOOD_USER, GOOD_USER)

    expect(
      await screen.findByRole("heading", { name: `Welcome ${GOOD_USER}` })
    ).toBeInTheDocument()
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument()
  })

  it("shows an error and stays put when the credentials are rejected", async () => {
    render(<AuthFlow />)

    await submitLogin(VILLAIN_USER, "hunter2")

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Incorrect user or password"
    )
    // Still on the form — a failed login must not navigate.
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: /welcome/i })).not.toBeInTheDocument()
  })

  it("validates before it ever reaches the network", async () => {
    const onSuccess = vi.fn()
    render(<LoginForm onSuccess={onSuccess} />)

    await submitLogin("not-an-email", "")

    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument()
    expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
    // MSW is configured with onUnhandledRequest: "error", so a stray request here
    // would fail the run — this asserts the request was never made at all.
  })
})
