/**
 * @dmb/auth — login, validation, and the session contract.
 *
 * Framework-agnostic on purpose: nothing here imports from `next/*`. The form
 * delegates the submit to an injected `action` (a Server Action, supplied by the
 * route), so the whole feature can be rendered and tested in plain jsdom with a
 * fake action — no App Router mock, no network.
 *
 * The split is deliberate: `login-contract.ts` is a plain module holding the
 * schema, types, and pure logic so *server* code (the Server Action) imports the
 * real implementations, while `login-form.tsx` is `"use client"` and holds only
 * the component. Mixing the two would hand the server client-reference stubs.
 */
export {
  INVALID_CREDENTIALS,
  loginSchema,
  parseLogin,
  verifyCredentials,
  // type LoginAction,
  type LoginState,
  type LoginValues,
  type SessionUser,
} from "./login-contract"

export { LoginForm } from "./login-form"
