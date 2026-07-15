import "server-only"

/**
 * Artificial server latency, so the states that only exist *while* a request is
 * in flight are actually observable: the streaming skeleton (F11), the `LOAD
 * MORE` loading label, and — the whole point of ADR-005 — the optimistic window
 * between an instant local update and the server's reconciliation.
 *
 * It's a mock affordance, not production behaviour: a real store is fast and this
 * helper goes away with it. Kept `server-only` and behind one named constant so
 * it's trivial to tune or delete, and it no-ops under test so the suite never
 * pays 1.2s per mutation.
 */
export const MOCK_LATENCY_MS = 1200

export function mockLatency(ms: number = MOCK_LATENCY_MS): Promise<void> {
  if (process.env.NODE_ENV === "test") return Promise.resolve()
  return new Promise((resolve) => setTimeout(resolve, ms))
}
