# @dmb/auth

Login: the form, the validation schema, and the session contract.

```ts
import { LoginForm, loginSchema, login, type SessionUser } from "@dmb/auth";
```

## The rule this package exists to enforce

**Nothing here imports from `next/*`.**

That is not stylistic. The moment the form imports `useRouter` from `next/navigation`, it can
no longer be rendered in a jsdom test without mocking the App Router — and the test stops
exercising the real component. So the form reports success through an **`onSuccess` callback**
and has no opinion about routing:

```tsx
// app/login/login-route.tsx — the only file that knows Next exists
<LoginForm onSuccess={() => router.push("/feed")} />
```

Everything framework-shaped (the page, the redirect) lives under `app/`. Everything else — the
form, the schema, the request — lives here.

## Testing

Everything the test needs lives in this package: `login-form.test.tsx` drives the real form,
and `login-form.mocks.ts` — the MSW server and the `POST /api/session` handlers — sits right
beside it. The test never reaches into a shared root-level mock folder; the only global setup
(`test/setup.ts`) is generic jsdom matchers and cleanup.

It drives the form with React Testing Library and **MSW v2** answering `POST /api/session` at
the network layer. No mocked `fetch`, no mocked router, no mocked component: the thing under
test is the thing that ships.

The mock keys its response off the **email**, so a test picks its outcome by choosing who logs
in (`login-form.mocks.ts`):

| Email | Response |
|---|---|
| `gooduser@dispatch.dev` | `200` + session → redirected to the protected view |
| `villainuser@dispatch.dev` | `401` → "Incorrect user or password", stays on the form |

```bash
npm test
```

MSW runs with `onUnhandledRequest: "error"`, so an endpoint nobody mocked fails the run loudly
rather than hanging. That is what lets the validation test assert the request was never made at
all, rather than merely that it didn't succeed.

## Notes

- **Validation is plain zod + `safeParse`**, not react-hook-form. Two fields and one submit
  don't earn a form library; RHF is the obvious upgrade the moment there's a third form or
  field-level async validation. Naming the tool not used, and why.
- `loginSchema` is exported so the route handler serving `POST /api/session` can validate with
  the *same* schema rather than redeclaring it — which is what stops client and server
  validation from drifting.
- The seeded-account convention is **password == email** (O4). The MSW mock deliberately keys
  on email alone, because a test fixture should be able to choose its outcome without knowing
  that rule.
