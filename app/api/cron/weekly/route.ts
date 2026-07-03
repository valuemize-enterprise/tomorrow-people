/**
 * app/api/cron/weekly/route.ts
 *
 * Runs at 06:00 UTC every Saturday (see vercel.json).
 * Protected by withCron() — requires Authorization: Bearer <CRON_SECRET>.
 *
 * Jobs:
 *   1. Run friction audit for all users with active habits
 *   2. Log summary for monitoring
 */

import { NextResponse } from "next/server"
import { withCron } from "@/lib/middleware/api"
import { prisma } from "@/lib/prisma"
import { runFrictionAudit } from "@/lib/services/progress.service"

export const GET = withCron(async () => {
  const users = await prisma.user.findMany({
    where:  { habits: { some: { isActive: true } } },
    select: { id: true, timezone: true },
  })

  let totalFlagged = 0
  let errors       = 0

  for (const user of users) {
    try {
      const result = await runFrictionAudit(user.id, user.timezone ?? "UTC")
      totalFlagged += result.flagged
    } catch (err) {
      console.error(`[cron/weekly] Friction audit failed for user ${user.id}:`, err)
      errors++
    }
  }

  console.log(
    `[cron/weekly] Done — ${users.length} users, ${totalFlagged} habits flagged, ${errors} errors`,
  )
  return NextResponse.json({ users: users.length, totalFlagged, errors })
})
