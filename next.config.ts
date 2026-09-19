import type { NextConfig } from "next"

/**
 * A static clock page: no user input, no third-party frames, no APIs that need
 * a permission. The headers below cost nothing and close the defaults that
 * Vercel does not set on its own.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "geolocation=(), microphone=(), camera=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // `unsafe-inline` on script-src is not optional here: Next streams the RSC
  // payload through inline <script> tags, so a strict policy blanks the page.
  // The rest of the directives still hold, which is the part worth having.
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; upgrade-insecure-requests",
  },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }]
  },
}

export default nextConfig
