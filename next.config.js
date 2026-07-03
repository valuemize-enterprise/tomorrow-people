/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Prevents Prisma from being bundled into edge chunks
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"],
  },

  // ── Images ────────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "avatars.githubusercontent.com", pathname: "/**" },
    ],
  },

  // ── Security headers ──────────────────────────────────────────────
  // Applied to every response. CSP is the strongest lever; keep it tight.
  async headers() {
    const isDev = process.env.NODE_ENV === "development"

    // Content Security Policy — permit only what is genuinely needed
    const csp = [
      "default-src 'self'",
      // Scripts: self + Next.js inline runtime + Google Fonts loader
      isDev
        ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
        : "script-src 'self' 'unsafe-inline'",
      // Styles: self + Google Fonts
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fonts: Google Fonts CDN
      "font-src 'self' https://fonts.gstatic.com",
      // Images: self + Google user avatars + data URIs
      "img-src 'self' data: https://lh3.googleusercontent.com https://avatars.githubusercontent.com",
      // API calls: only same origin
      "connect-src 'self'",
      // No frames allowed
      "frame-ancestors 'none'",
      // Block mixed content
      "upgrade-insecure-requests",
    ].join("; ")

    const securityHeaders = [
      { key: "Content-Security-Policy",        value: csp },
      { key: "X-Content-Type-Options",          value: "nosniff" },
      { key: "X-Frame-Options",                 value: "DENY" },
      { key: "X-XSS-Protection",                value: "1; mode=block" },
      { key: "Referrer-Policy",                 value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy",              value: "camera=(), microphone=(), geolocation=()" },
      ...(isDev
        ? []
        : [
            {
              key:   "Strict-Transport-Security",
              value: "max-age=31536000; includeSubDomains; preload",
            },
          ]),
    ]

    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // Extra cache prevention on API routes
        source: "/api/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
          { key: "Pragma",        value: "no-cache" },
        ],
      },
      {
        // Cron routes: prevent all caching and restrict to POST/GET
        source: "/api/cron/(.*)",
        headers: [
          { key: "Cache-Control",             value: "no-store" },
          { key: "X-Robots-Tag",              value: "noindex" },
        ],
      },
    ]
  },

  // ── Redirects ─────────────────────────────────────────────────────
  async redirects() {
    return [
      {
        source:      "/dashboard",
        destination: "/today",
        permanent:   false,
      },
    ]
  },

  // ── Logging ───────────────────────────────────────────────────────
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === "development",
    },
  },
}

module.exports = nextConfig
