import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @dmb/ui-kit ships TypeScript source, not a build artifact — Next compiles it
  // with the app so the package needs no build step of its own.
  transpilePackages: ["@dmb/ui-kit"],
};

export default nextConfig;
