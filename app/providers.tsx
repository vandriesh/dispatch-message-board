"use client"

import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

/**
 * The app's client boundary for TanStack Query (ADR-006). The `QueryClient` is
 * created once per browser session via `useState` — never at module scope, which
 * would leak one client's cache across requests in the server runtime. Deliberately
 * thin: the feed hydrates its own first page into the cache (Q1), so nothing needs
 * to be dehydrated here.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          // The server renders the first page; don't immediately refetch it on mount.
          queries: { staleTime: 30_000, refetchOnWindowFocus: false },
        },
      })
  )

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
