import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { FeedClient } from "./feed-client"
import { type FeedUser } from "./message"
import { type OwnedFeedPage } from "./rbac"

/**
 * The feed list is virtualized (`@tanstack/react-virtual`, B2), which reads real
 * layout: jsdom has none, so without a viewport height the virtualizer renders an
 * empty window and no row — optimistic or otherwise — is on screen. `virtual-core`
 * measures both the scroll viewport and each row via `offsetHeight`/`offsetWidth`
 * (jsdom hard-codes these to 0), so give every element a non-zero size and add a
 * no-op ResizeObserver so a window actually paints. Scoped to this file (the only
 * one that mounts the virtualized FeedClient); set at module load so
 * `vi.unstubAllGlobals` in afterEach can't clear them mid-suite.
 */
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
  configurable: true,
  get: () => 800,
})
Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
  configurable: true,
  get: () => 500,
})

/**
 * The highest-value test in the project (per _ARCHITECTURE.md's "Next steps"): the
 * optimistic-rollback path (B3, ADR-005). Not a render snapshot — the logic most
 * likely to break silently. We drive a post against a forced server failure and
 * assert the row appears immediately, then rolls back, with the error surfaced.
 *
 * `fetch` is stubbed rather than reaching MSW: the mutation only needs a controlled
 * response, and a small delay makes the optimistic window deterministic to observe
 * (the row is present *during* the in-flight request, gone after it rejects).
 */

const ADAM: FeedUser = {
  id: "u_adam",
  handle: "adam",
  name: "Adam",
  email: "adam@dispatch.dev",
}

const EMPTY_PAGE: OwnedFeedPage = { items: [], nextCursor: null, total: 0 }

function renderFeed(initialPage: OwnedFeedPage = EMPTY_PAGE) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <FeedClient initialPage={initialPage} filters={{}} currentUser={ADAM} />
    </QueryClientProvider>
  )
}

/** A fetch that resolves to `status` after a short, controllable delay. */
function stubFetch(status: number, body: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve(
                new Response(JSON.stringify(body), {
                  status,
                  headers: { "Content-Type": "application/json" },
                })
              ),
            30
          )
        )
    )
  )
}

async function post(text: string) {
  const user = userEvent.setup()
  await user.type(screen.getByRole("textbox"), text)
  await user.click(screen.getByRole("button", { name: /post/i }))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("optimistic post", () => {
  it("rolls the row back and surfaces the error when the server rejects", async () => {
    stubFetch(500, { error: "Simulated failure" })
    renderFeed()

    await post("this will fail")

    // Optimistic: the row is on screen the instant we submit, before the server answers.
    const row = await screen.findByText("this will fail")
    expect(row).toBeInTheDocument()

    // Rollback: once the request rejects, the row is removed and the error shows.
    await waitForElementToBeRemoved(() => screen.queryByText("this will fail"))
    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn't post/i)
  })

  it("keeps the row and clears pending when the server accepts", async () => {
    stubFetch(201, {
      id: "m_real",
      body: "shipped it",
      tag: "PRODUCT",
      createdBy: ADAM.id,
      createdAt: new Date().toISOString(),
      author: ADAM,
      owner: true,
    })
    renderFeed()

    await post("shipped it")

    expect(await screen.findByText("shipped it")).toBeInTheDocument()
    // The optimistic row is marked pending ("sending…") until the server answers…
    expect(screen.getByText(/sending/i)).toBeInTheDocument()
    // …then the request settles: pending clears, the row stays, no error.
    await waitForElementToBeRemoved(() => screen.queryByText(/sending/i))
    expect(screen.getByText("shipped it")).toBeInTheDocument()
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })
})
