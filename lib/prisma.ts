import "@/config/env"

import { PrismaClient } from "@prisma/client"

const createPrismaClient = () =>
  new PrismaClient({
    log: [
      { level: "query", emit: "event" },
      { level: "error", emit: "stdout" },
      { level: "warn",  emit: "stdout" },
    ] as const,
  })

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

export const db = prisma

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma

  if (process.env.NODE_ENV === "development") {
    prisma.$on("query", (e: { duration: number; query: string }) => {
      if (e.duration > 500) {
        console.warn(`[prisma] Slow query (${e.duration}ms): ${e.query.slice(0, 120)}`)
      }
    })
  }
}