"use client"

import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query"

import { messagesKey } from "./feed-query"
import {
  type FeedFilters,
  type FeedUser,
  type MessageDraft,
} from "./message"
import { type FeedRow, type OwnedFeedPage } from "./rbac"

/**
 * The optimistic write layer (B3, ADR-005). Each hook applies its change to the
 * `["messages", filters]` cache *before* the request resolves, then reconciles:
 * `onSuccess` swaps the temp/pending row for the server's, `onError` restores the
 * pre-mutation snapshot (the rollback) and surfaces the failure. Keyed on the same
 * filters as the list query so the overlay and the list are the one cache entry.
 *
 * The store lag (mockLatency) is what makes the optimistic window visible; the
 * "fail"/"keep" magic words are what make the rollback demoable (see the routes).
 */

type Cache = InfiniteData<OwnedFeedPage> | undefined

const mapItems = (
  data: NonNullable<Cache>,
  fn: (items: FeedRow[]) => FeedRow[]
): InfiniteData<OwnedFeedPage> => ({
  ...data,
  pages: data.pages.map((page) => ({ ...page, items: fn(page.items as FeedRow[]) })),
})

const insertAtTop = (data: Cache, row: FeedRow): Cache =>
  data && data.pages.length > 0
    ? { ...data, pages: data.pages.map((p, i) => (i === 0 ? { ...p, items: [row, ...p.items] } : p)) }
    : { pages: [{ items: [row], nextCursor: null, total: 1 }], pageParams: [null] }

const removeRow = (data: Cache, id: string): Cache =>
  data ? mapItems(data, (items) => items.filter((m) => m.id !== id)) : data

const replaceRow = (data: Cache, id: string, next: FeedRow): Cache =>
  data ? mapItems(data, (items) => items.map((m) => (m.id === id ? next : m))) : data

/**
 * Post failures have no row to attach to (the temp row rolls back) — they go to
 * the composer, along with the rejected draft so the text can be restored rather
 * than lost.
 */
type PostArgs = {
  filters: FeedFilters
  currentUser: FeedUser
  onError?: (message: string, draft: MessageDraft) => void
}

/** Edit/delete failures carry the row id, so the error can render under that card. */
type RowArgs = {
  filters: FeedFilters
  onError?: (message: string, id: string) => void
}

async function mutate<T>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`${method} ${url} failed (${res.status})`)
  return (res.status === 204 ? undefined : await res.json()) as T
}

/** Post a new message: temp row at the top now, swapped for the server row on success. */
export function usePostMessage({ filters, currentUser, onError }: PostArgs) {
  const qc = useQueryClient()
  const key = messagesKey(filters)

  return useMutation({
    mutationFn: (draft: MessageDraft) =>
      mutate<FeedRow>("/api/messages", "POST", draft),
    onMutate: async (draft) => {
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<InfiniteData<OwnedFeedPage>>(key)
      const temp: FeedRow = {
        id: `temp_${crypto.randomUUID()}`,
        body: draft.body,
        tag: draft.tag,
        createdBy: currentUser.id,
        createdAt: new Date().toISOString(),
        author: currentUser,
        owner: true,
        pending: true,
      }
      qc.setQueryData<Cache>(key, (old) => insertAtTop(old, temp))
      return { previous, tempId: temp.id }
    },
    onError: (_err, draft, ctx) => {
      if (ctx) qc.setQueryData(key, ctx.previous)
      onError?.("Couldn't post your message — it wasn't saved.", draft)
    },
    onSuccess: (created, _draft, ctx) => {
      qc.setQueryData<Cache>(key, (old) => replaceRow(old, ctx.tempId, created))
    },
  })
}

/** Edit a message's body in place: patched (pending) now, reconciled with the server row. */
export function useEditMessage({ filters, onError }: RowArgs) {
  const qc = useQueryClient()
  const key = messagesKey(filters)

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      mutate<FeedRow>(`/api/messages/${id}`, "PATCH", { body }),
    onMutate: async ({ id, body }) => {
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<InfiniteData<OwnedFeedPage>>(key)
      qc.setQueryData<Cache>(key, (old) =>
        old
          ? mapItems(old, (items) =>
              items.map((m) => (m.id === id ? { ...m, body, pending: true } : m))
            )
          : old
      )
      return { previous }
    },
    onError: (_err, vars, ctx) => {
      if (ctx) qc.setQueryData(key, ctx.previous)
      onError?.("Couldn't save your edit — the change was reverted.", vars.id)
    },
    onSuccess: (updated) => {
      qc.setQueryData<Cache>(key, (old) => replaceRow(old, updated.id, updated))
    },
  })
}

/** Delete a message: removed now, re-inserted (rollback) if the server refuses. */
export function useDeleteMessage({ filters, onError }: RowArgs) {
  const qc = useQueryClient()
  const key = messagesKey(filters)

  return useMutation({
    mutationFn: (id: string) => mutate<void>(`/api/messages/${id}`, "DELETE"),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<InfiniteData<OwnedFeedPage>>(key)
      qc.setQueryData<Cache>(key, (old) => removeRow(old, id))
      return { previous }
    },
    onError: (_err, id, ctx) => {
      if (ctx) qc.setQueryData(key, ctx.previous)
      onError?.("Couldn't delete that message — it's back.", id)
    },
  })
}
