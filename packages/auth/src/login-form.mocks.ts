import { http, HttpResponse } from "msw"
import { setupServer } from "msw/node"

import { INVALID_CREDENTIALS, type LoginValues, type SessionUser } from "./login-form"

/**
 * The mock backend for login, colocated with the form it mocks.
 *
 * This is the `POST /api/session` contract standing in for the real route
 * handler (ADR-001), and it lives next to `login-form.tsx` on purpose: the test,
 * the component, the schema, and the mock of the endpoint they agree on are all
 * one directory. Nothing here reaches into a shared root-level test folder, so the
 * auth package carries its own test surface.
 *
 * The response is keyed on the email, so a test picks its outcome by choosing who
 * logs in — no per-test handler override.
 */
export const GOOD_USER = "gooduser@dispatch.dev"
export const VILLAIN_USER = "villainuser@dispatch.dev"

export const sessionHandlers = [
  http.post("/api/session", async ({ request }) => {
    const { email } = (await request.json()) as LoginValues

    if (email === VILLAIN_USER) {
      return HttpResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 })
    }

    return HttpResponse.json({
      id: "u_1",
      email,
      name: "Good User",
      handle: "gooduser",
    } satisfies SessionUser)
  }),
]

/** The auth test owns its own MSW server; lifecycle is wired in the test file. */
export const server = setupServer(...sessionHandlers)
