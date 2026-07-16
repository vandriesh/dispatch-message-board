import "server-only"

/**
 * Artificial server latency, so the in-flight-only states are observable: the
 * streaming skeleton, the loading labels, and the optimistic window. Goes away
 * with a real store; no-ops under test so the suite never pays 1.2s per call.
 */
export const MOCK_LATENCY_MS = 1200

export function mockLatency(ms: number = MOCK_LATENCY_MS): Promise<void> {
  if (process.env.NODE_ENV === "test") return Promise.resolve()
  return new Promise((resolve) => setTimeout(resolve, ms))
}
