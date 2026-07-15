import "@testing-library/jest-dom/vitest"

import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

/**
 * Generic, cross-package test setup — jsdom matchers and DOM cleanup between
 * tests. Nothing domain-specific lives here.
 *
 * MSW is deliberately NOT set up globally: each package owns the server and the
 * handlers for the endpoints *it* talks to, colocated with the code under test
 * (see packages/auth/src/login-form.mocks.ts). That keeps a test as close to its
 * target as possible instead of reaching into a shared mock registry.
 */
afterEach(() => {
  cleanup()
})
