import "server-only"

import { faker } from "@faker-js/faker"

import { TAGS, USERS, type Message } from "./message"

/**
 * The mock "database": ~1000 messages seeded once, in memory. `server-only`
 * makes an accidental client import a build error rather than a 5MB faker
 * bundle.
 */
const COUNT = 1000
// Fixed seed → reproducible data, so shared filtered URLs stay meaningful.
const SEED = 20260715
// Posts date within a rolling 24h window one day back, so the feed reads as
// recent rather than smeared across a month.
const DAY_MS = 24 * 60 * 60 * 1000

function seed(): Message[] {
  faker.seed(SEED)
  const now = Date.now()

  const messages = Array.from({ length: COUNT }, (_, i): Message => {
    const author = faker.helpers.arrayElement(USERS)
    return {
      id: `m_${i.toString(36).padStart(4, "0")}`,
      body: faker.lorem.sentence({ min: 4, max: 26 }).slice(0, 240),
      tag: faker.helpers.arrayElement(TAGS),
      createdBy: author.id,
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

// Pinned to `globalThis` so HMR doesn't re-seed mid-session and break any
// cursor or optimistic id the client is holding.
const globalForFeed = globalThis as typeof globalThis & {
  __dmbFeedStore?: Message[]
}
export const messagesStore: Message[] =
  globalForFeed.__dmbFeedStore ?? (globalForFeed.__dmbFeedStore = seed())
