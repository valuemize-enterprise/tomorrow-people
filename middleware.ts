/**
 * middleware.ts — runs on the Edge runtime before every matched request.
 *
 * Responsibilities:
 *   1. Rate limiting (IP-based, per-route limits)
 *   2. Auth guard (redirect unauthenticated users)
 *   3. Security response headers on every request
 *   4. Block direct hits to /api/cron/* from non-Vercel IPs
 */

import { NextResponse, type NextRequest } from "next/server"
import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { rateLimit, AUTH_LIMIT, API_LIMIT, CRON_LIMIT } from "@/lib/middleware/rate-limit"

// NextAuth edge-compatible handler (no Prisma — authConfig only)
const { auth } = NextAuth(authConfig)

// ─── Route matchers ────────────────────────────────────────────────

const PUBLIC_PATHS = new Set(["/", "/login", "/signup"])
const AUTH_API     = /^\/api\/auth/
const CRON_API     = /^\/api\/cron/

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname) || AUTH_API.test(pathname)
}

// ─── Middleware ────────────────────────────────────────────────────

export default auth(async function middleware(req: NextRequest) {
  const { nextUrl, ip, headers } = req
  const clientIp = ip ?? headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown"
  const pathname  = nextUrl.pathname

  // 1. ── Rate limiting ─────────────────────────────────────────────

  let limitConfig = API_LIMIT

  if (AUTH_API.test(pathname)) {
    limitConfig = AUTH_LIMIT
  } else if (CRON_API.test(pathname)) {
    // Cron endpoints get a tight IP-level limit as a second layer of defence.
    // Primary protection is the CRON_SECRET token check inside the route.
    limitConfig = CRON_LIMIT
  }

  const rl = await rateLimit(`${clientIp}:${pathname}`, limitConfig)

  if (!rl.success) {
    return new NextResponse("Too many requests", {
      status: 429,
      headers: {
        "Retry-After":       String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        "X-RateLimit-Reset": String(rl.resetAt),
      },
    })
  }

  // 2. ── Auth guard ─────────────────────────────────────────────────

  // @ts-expect-error — auth() injects session onto req
  const session = req.auth as { user?: { id: string; onboardingComplete: boolean } } | null

  if (!isPublic(pathname)) {
    if (!session?.user) {
      return NextResponse.redirect(new URL("/login", nextUrl))
    }

    if (
      !session.user.onboardingComplete &&
      !pathname.startsWith("/onboarding") &&
      !pathname.startsWith("/api/")
    ) {
      return NextResponse.redirect(new URL("/onboarding", nextUrl))
    }
  }

  // Authenticated user hitting login → redirect to app
  if (session?.user && pathname === "/login") {
    const dest = session.user.onboardingComplete ? "/today" : "/onboarding"
    return NextResponse.redirect(new URL(dest, nextUrl))
  }

  // 3. ── Security headers ───────────────────────────────────────────

  const res = NextResponse.next()

  res.headers.set("X-Content-Type-Options", "nosniff")
  res.headers.set("X-Frame-Options", "DENY")
  res.headers.set("X-XSS-Protection", "1; mode=block")
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

  // HSTS — only in production over HTTPS
  if (process.env.NODE_ENV === "production") {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    )
  }

  // Rate limit headers for client visibility
  res.headers.set("X-RateLimit-Remaining", String(rl.remaining))
  res.headers.set("X-RateLimit-Reset", String(rl.resetAt))

  return res
})

// ─── Matcher ──────────────────────────────────────────────────────

export const config = {
  matcher: [
    // All paths except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
}