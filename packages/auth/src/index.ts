/**
 * @dmb/auth — framework-agnostic: nothing here imports `next/*`. The form takes
 * an injected `action` (the route supplies the Server Action), and the contract
 * lives in a plain module apart from the `"use client"` form — mixing the two
 * would hand server code client-reference stubs.
 */
export {
  INVALID_CREDENTIALS,
  loginSchema,
  parseLogin,
  verifyCredentials,
  type LoginState,
  type LoginValues,
  type SessionUser,
} from "./login-contract"

export { LoginForm } from "./login-form"
