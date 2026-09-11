import type { NextConfig } from "next";

/**
 * The Django API is proxied under the Next.js origin rather than called at
 * localhost:8000 directly. Same-origin requests mean the session cookie is sent
 * without SameSite exceptions, Django's CSRF referer check passes, and no CORS
 * preflight is involved — in development or behind one domain in production.
 */
const API_ORIGIN = process.env.BACKEND_ORIGIN ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  // Django routes end in a slash and 301 anything that does not. Without this,
  // Next answers `/api/bugs/` with a 308 to `/api/bugs` before the rewrite is
  // even reached, and every API call dies on the redirect.
  skipTrailingSlashRedirect: true,

  async redirects() {
    return [
      // The landing page now lives at the site root. This keeps any link that
      // still points at /nexora working instead of 404ing.
      { source: "/nexora", destination: "/", permanent: false },
    ];
  },

  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${API_ORIGIN}/api/:path*` },
      // Uploaded evidence is served by Django in development.
      { source: "/media/:path*", destination: `${API_ORIGIN}/media/:path*` },
    ];
  },
};

export default nextConfig;
