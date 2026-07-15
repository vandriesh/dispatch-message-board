import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The @dmb/* workspaces ship TypeScript source, not build artifacts — Next
  // compiles them with the app, so they need no build step of their own.
  transpilePackages: ["@dmb/ui-kit", "@dmb/auth", "@dmb/feed"],
};

export default nextConfig;
