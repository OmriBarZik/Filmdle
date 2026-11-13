import type { NextConfig } from "next";

/**
 * Security headers for every response. Kept deliberately narrow so they can't break the
 * posters (hot-linked from upload.wikimedia.org) or the film details (fetched from
 * Wikipedia's REST API):
 * - The CSP only limits who may frame the site and a few injection sinks. It has no
 *   `script-src`, since a script policy would need nonces (which conflict with static
 *   pages) or `'unsafe-inline'`.
 * - Poster images send no Referer at all (`referrerPolicy="no-referrer"` on each <img>),
 *   so the address of the page a player is on never reaches Wikimedia.
 * - The Permissions-Policy turns off features the game never uses.
 */
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  },
  // For old browsers that ignore `frame-ancestors`.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
