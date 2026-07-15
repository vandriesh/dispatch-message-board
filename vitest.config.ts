import path from "node:path"

import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

const pkg = (name: string) => path.resolve(__dirname, `packages/${name}/src`)

export default defineConfig({
  plugins: [react()],
  resolve: {
    /**
     * Vite does not read tsconfig `paths`, so the workspace aliases are restated
     * here — keep in sync with tsconfig.json.
     *
     * Both an exact and a subpath rule per package: the kit's own components
     * import `@dmb/ui-kit/lib/utils`, which an exact-match alias would miss.
     * Order matters — exact before prefix.
     */
    alias: [
      // `server-only` throws when imported outside a Server Component; under
      // vitest there is no `react-server` condition, so point it at the package's
      // own no-op stub to let server modules (the store, mutations) be unit-tested.
      {
        find: /^server-only$/,
        replacement: path.resolve(
          __dirname,
          "node_modules/server-only/empty.js",
        ),
      },
      { find: /^@dmb\/ui-kit$/, replacement: `${pkg("ui-kit")}/index.ts` },
      { find: /^@dmb\/ui-kit\//, replacement: `${pkg("ui-kit")}/` },
      { find: /^@dmb\/auth$/, replacement: `${pkg("auth")}/index.ts` },
      { find: /^@dmb\/auth\//, replacement: `${pkg("auth")}/` },
      { find: /^@dmb\/feed$/, replacement: `${pkg("feed")}/index.ts` },
      { find: /^@dmb\/feed\/server$/, replacement: `${pkg("feed")}/server.ts` },
      { find: /^@dmb\/feed\//, replacement: `${pkg("feed")}/` },
    ],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    include: ["packages/**/*.test.{ts,tsx}", "features/**/*.test.{ts,tsx}"],
  },
})
