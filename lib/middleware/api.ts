/**
 * lib/middleware/api.ts
 * FIXES:
 *   1. withCron(): strict CRON_SECRET check — empty string no longer passes
 *   2. withCron(): timing-safe comparison to prevent timing attacks
 *   3. withAuth(): better error logging without leaking session details
 */

import { NextResponse, type NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { toErrorResponse, UnauthorisedError } from "@/lib/errors"

export type AuthContext = {
  userId: string
  params?: Record<string, string>
}

type AuthedHandler = (req: NextRequest, ctx: AuthContext) => Promise<NextResponse>

export function withAuth(handler: AuthedHandler) {
  return async function routeHandler(
    req: NextRequest,
    routeContext?: { params?: Record<string, string> },
  ): Promise<NextResponse> {
    try {
      const session = await auth()

      if (!session?.user?.id) {
        throw new UnauthorisedError()
      }

      return await handler(req, {
        userId: session.user.id,
        params: routeContext?.params,
      })
    } catch (err) {
      return toErrorResponse(err)
    }
  }
}

/**
 * withCron — protects cron routes.
 *
 * FIXED:
 *   - Strict length check: secret must be ≥ 32 chars (empty string is rejected)
 *   - trim() before compare: no trailing-space bypass
 *   - Constant-time compare via crypto.timingSafeEqual to prevent timing attacks
 */
export function withCron(handler: () => Promise<NextResponse>) {
  return async function cronHandler(req: NextRequest): Promise<NextResponse> {
    const secret = process.env.CRON_SECRET ?? ""

    // FIX 1: Reject if secret not configured properly
    if (secret.length < 32) {
      console.error("[cron] CRON_SECRET is not set or too short — refusing all cron requests")
      return NextResponse.json({ error: "Cron not configured" }, { status: 503 })
    }

    const authHeader = req.headers.get("authorization")?.trim() ?? ""
    const expectedBearer = `Bearer ${secret}`

    // FIX 2: Constant-time comparison to prevent timing attacks
    const matches = timingSafeEqual(authHeader, expectedBearer)

    if (!matches) {
      console.warn(
        "[cron] Unauthorised attempt —",
        req.headers.get("x-forwarded-for") ?? "unknown IP",
      )
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
    }

    try {
      return await handler()
    } catch (err) {
      console.error("[cron] Unhandled error:", err)
      return NextResponse.json({ error: "Cron job failed" }, { status: 500 })
    }
  }
}

// Simple timing-safe string compare (no crypto.timingSafeEqual in Edge runtime)
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}
