import { describe, expect, it } from "vitest"

import { getMessages } from "./query"
import { messagesStore } from "./store"

/**
 * Every bound is derived from the store rather than written down: the seed
 * moves with `Date.now()`, so a hard-coded date would rot by tomorrow.
 */
const all = messagesStore.length
const newest = messagesStore[0]
const oldest = messagesStore[all - 1]
const dayOf = (iso: string) => iso.slice(0, 10)

describe("getMessages — date range", () => {
  it("is inclusive of both ends", () => {
    const { total } = getMessages({
      from: oldest.createdAt,
      to: newest.createdAt,
      limit: 1,
    })
    expect(total).toBe(all)
  })

  it("filters at instant precision, not by day", () => {
    const mid = messagesStore[Math.floor(all / 2)]
    const expected = messagesStore.filter(
      (m) => m.createdAt >= mid.createdAt
    ).length

    expect(getMessages({ from: mid.createdAt, limit: 1 }).total).toBe(expected)
    expect(expected).toBeLessThan(all)
  })

  it("still reads a bare date as the whole UTC day at both ends", () => {
    // The old contract, kept alive for links shared before the range grew a time.
    // Comparing a bare `YYYY-MM-DD` against a full timestamp without expanding it
    // would silently drop every row on the `to` day.
    const { total } = getMessages({
      from: dayOf(oldest.createdAt),
      to: dayOf(newest.createdAt),
      limit: 1,
    })
    expect(total).toBe(all)
  })

  it("ignores a bound it cannot parse", () => {
    // `app/feed/page.tsx` renders the first page straight from the URL, without
    // the route's zod pass — so a hand-typed bound reaches this unvalidated.
    expect(getMessages({ from: "garbage", limit: 1 }).total).toBe(all)
  })
})
