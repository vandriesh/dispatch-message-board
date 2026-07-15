import { redirect } from "next/navigation"

import { getSession } from "@/app/(auth)/session"

/**
 * The index route is a pure gate: it owns no UI of its own. A signed-in user is
 * sent to the feed (F4); everyone else lands on login. Keeping this thin means
 * the real surfaces stay at /feed and /login rather than being duplicated here.
 */
export default async function Home() {
  const session = await getSession()
  redirect(session ? "/feed" : "/login")
}
