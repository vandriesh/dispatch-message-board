"use client"

import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

// The QueryClient is created via `useState`, never at module scope — module
// scope would leak one client's cache across requests in the server runtime.
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
