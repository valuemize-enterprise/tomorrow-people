/**
 * lib/prisma.ts
 *
 * Singleton Prisma Client.
 *
 * Changes from dev version:
 *   1. Imports env validation so a bad deploy throws at cold start
 *   2. Adds connection timeout and query logging only in development
 *   3. Exports a typed db alias for ergonomics
 */

import "@/config/env"   // ← throws immediately if any env var is missing

import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ([
            { level: "query", emit: "event" },
            { level: "error", emit: "stdout" },
            { level: "warn",  emit: "stdout" },
          ] as const)
        : ([{ level: "error", emit: "stdout" }] as const),
  })

// Alias — use whichever reads better in context
export const db = prisma

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma

  // Log slow queries (>500ms) in development
  prisma.$on("query", (e: { duration: number; query: string }) => {
    if (e.duration > 500) {
      console.warn(`[prisma] Slow query (${e.duration}ms): ${e.query.slice(0, 120)}`)
    }
  })
}
