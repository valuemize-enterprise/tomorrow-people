/**
 * app/api/health/route.ts
 * Aliased at /healthz via vercel.json rewrite.
 *
 * Checks:
 *   1. API is responding
 *   2. Database connection is live (single lightweight query)
 *
 * Used by:
 *   - Vercel uptime monitoring
 *   - Load balancer health probes
 *   - Your own monitoring (Better Uptime, Checkly, etc.)
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"  // never cache this route

export async function GET() {
  const start = Date.now()

  try {
    // Lightest possible query — just checks the connection is alive
    await prisma.$queryRaw`SELECT 1`

    return NextResponse.json(
      {
        status:   "ok",
        database: "connected",
        latency:  `${Date.now() - start}ms`,
        ts:       new Date().toISOString(),
      },
      { status: 200 },
    )
  } catch (err) {
    console.error("[health] Database check failed:", err)

    return NextResponse.json(
      {
        status:   "error",
        database: "unreachable",
        latency:  `${Date.now() - start}ms`,
        ts:       new Date().toISOString(),
      },
      { status: 503 },
    )
  }
}
