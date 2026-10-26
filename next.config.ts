import type { NextConfig } from "next";

// No CSP: a nonce-based policy forces every route to render dynamically, which
// defeats the prerendered static shell (see docs/ARCHITECTURE.md).
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), payment=(), geolocation=(self)",
  },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  poweredByHeader: false,
  // Cache lifetimes per upstream. `expire` stays above 5 min so these entries are
  // still included in prerenders (see cacheLife "Prerendering behavior").
  cacheLife: {
    forecast: { stale: 300, revalidate: 900, expire: 3600 },
    airQuality: { stale: 300, revalidate: 3600, expire: 86400 },
    alerts: { stale: 300, revalidate: 300, expire: 1800 },
  },
  turbopack: {
    root: import.meta.dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
