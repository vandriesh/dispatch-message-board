import { describe, expect, it } from "vitest"

import { USERS } from "./message"
import { deleteMessage, editMessage } from "./mutations"
import { messagesStore } from "./store"

/**
 * The authorship gate (F8/F9). These exercise the server-side re-check directly —
 * the point being that ownership is enforced in the mutation itself, not just by
 * the client hiding a button. The store is the seeded in-memory singleton, so the
 * ordering here mutates it deliberately (edit before the delete that removes).
 */
const [adam, eva] = USERS // u_adam, u_eva

const firstBy = (userId: string) =>
  messagesStore.find((m) => m.createdBy === userId)!

describe("feed authorship mutations", () => {
  it("lets the author edit their own message", () => {
    const mine = firstBy(adam.id)
    const res = editMessage(mine.id, adam.id, "a fresh body")
    expect(res).toEqual({
      ok: true,
      message: expect.objectContaining({ id: mine.id, body: "a fresh body" }),
    })
    expect(messagesStore.find((m) => m.id === mine.id)?.body).toBe("a fresh body")
  })

  it("refuses to edit another user's message — the server ownership re-check", () => {
    const adams = firstBy(adam.id)
    const before = adams.body
    const res = editMessage(adams.id, eva.id, "hijacked")
    expect(res).toEqual({ ok: false, error: "forbidden" })
    expect(messagesStore.find((m) => m.id === adams.id)?.body).toBe(before)
  })

  it("rejects an empty or over-long body", () => {
    const mine = firstBy(adam.id)
    expect(editMessage(mine.id, adam.id, "   ")).toEqual({
      ok: false,
      error: "invalid",
    })
    expect(editMessage(mine.id, adam.id, "x".repeat(241))).toEqual({
      ok: false,
      error: "invalid",
    })
  })

  it("reports not_found for an unknown id", () => {
    expect(editMessage("m_nope", adam.id, "hi")).toEqual({
      ok: false,
      error: "not_found",
    })
    expect(deleteMessage("m_nope", adam.id)).toEqual({
      ok: false,
      error: "not_found",
    })
  })

  it("refuses to delete another user's message", () => {
    const adams = firstBy(adam.id)
    const len = messagesStore.length
    expect(deleteMessage(adams.id, eva.id)).toEqual({
      ok: false,
      error: "forbidden",
    })
    expect(messagesStore.length).toBe(len)
    expect(messagesStore.some((m) => m.id === adams.id)).toBe(true)
  })

  it("lets the author delete their own message", () => {
    const mine = firstBy(eva.id)
    const len = messagesStore.length
    const res = deleteMessage(mine.id, eva.id)
    expect(res).toEqual({
      ok: true,
      message: expect.objectContaining({ id: mine.id }),
    })
    expect(messagesStore.length).toBe(len - 1)
    expect(messagesStore.some((m) => m.id === mine.id)).toBe(false)
  })
})
