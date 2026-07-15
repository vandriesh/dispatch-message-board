import "server-only"

import { faker } from "@faker-js/faker"

import { TAGS, USERS, type Message } from "./message"

/**
 * The mock "database": ~1000 messages generated once with faker and held in
 * memory for the life of the server process (N3). It stands behind the real route
 * handler (ADR-001) — swapping it for a durable store is a change to this one
 * module, not to every caller. `server-only` makes an accidental client import a
 * build error rather than a 5MB faker bundle.
 */
const COUNT = 1000
// Fixed seed → reproducible data across restarts, which keeps shareable filtered
// URLs and any test that reads the store deterministic.
const SEED = 20260715
// Every post is dated between 2 days ago and yesterday — a rolling 24h window one
// day back (now-2d .. now-1d) — so the feed reads as recent rather than smeared
// across a month.
const DAY_MS = 24 * 60 * 60 * 1000

function seed(): Message[] {
  faker.seed(SEED)
  const now = Date.now()

  const messages = Array.from({ length: COUNT }, (_, i): Message => {
    const author = faker.helpers.arrayElement(USERS)
    return {
      // Index-based id: unique, stable under the fixed seed, cheap to reason about.
      id: `m_${i.toString(36).padStart(4, "0")}`,
      // A short post, hard-capped at the 240-char limit (F2).
      body: faker.lorem.sentence({ min: 4, max: 26 }).slice(0, 240),
      tag: faker.helpers.arrayElement(TAGS),
      createdBy: author.id,
      // A random instant from 2 days ago up to yesterday.
      createdAt: new Date(
        now - DAY_MS - faker.number.int({ min: 0, max: DAY_MS })
      ).toISOString(),
    }
  })

  // Newest first, id as a stable tie-breaker — the exact order the cursor walks.
  messages.sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id)
  )
  return messages
}

/**
 * Persist across Next dev's hot reloads by pinning the store to `globalThis`.
 * Without this, every HMR edit would re-seed and reshuffle ids mid-session,
 * breaking any cursor or optimistic id the client is holding.
 */
const globalForFeed = globalThis as typeof globalThis & {
  __dmbFeedStore?: Message[]
}
export const messagesStore: Message[] =
  globalForFeed.__dmbFeedStore ?? (globalForFeed.__dmbFeedStore = seed())
