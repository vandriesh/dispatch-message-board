/**
 * @dmb/auth — login, validation, and the session contract.
 *
 * Framework-agnostic on purpose: nothing here imports from `next/*`. The form
 * reports success through an `onSuccess` callback and lets the *route* decide
 * what navigation means. That is what allows the whole feature to be rendered in
 * a plain jsdom test with MSW underneath it, with no App Router mock in sight.
 */
export {
  INVALID_CREDENTIALS,
  login,
  LoginForm,
  loginSchema,
  type LoginError,
  type LoginFormProps,
  type LoginValues,
  type SessionUser,
} from "./login-form"
