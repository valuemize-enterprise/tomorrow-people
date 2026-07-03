/**
 * app/api/cron/midnight/route.ts
 *
 * Runs at 00:01 UTC daily (see vercel.json).
 * Protected by withCron() — requires Authorization: Bearer <CRON_SECRET>.
 *
 * Jobs:
 *   1. Recalculate streaks for all users whose local midnight has just passed
 *   2. Update DailyScore.missedYesterday flag
 */

import { NextResponse } from "next/server"
import { withCron } from "@/lib/middleware/api"
import { prisma } from "@/lib/prisma"
import { recalcStreak } from "@/lib/services/progress.service"
import { recalcDailyScore } from "@/lib/services/scoring.service"

export const GET = withCron(async () => {
  const users = await prisma.user.findMany({
    where: {
      // Only process users who have at least one active habit
      habits: { some: { isActive: true } },
    },
    select: { id: true, timezone: true },
  })

  let processed = 0
  let errors    = 0

  for (const user of users) {
    try {
      const timezone = user.timezone ?? "UTC"

      // Get all active habits for this user
      const habits = await prisma.habit.findMany({
        where:  { userId: user.id, isActive: true },
        select: { id: true },
      })

      // Recalc streak for each habit
      await Promise.all(
        habits.map((h) => recalcStreak(h.id, timezone)),
      )

      // Recalc daily score (reflects new streak state)
      await recalcDailyScore(user.id, timezone)

      processed++
    } catch (err) {
      console.error(`[cron/midnight] Failed for user ${user.id}:`, err)
      errors++
      // Continue with next user — don't let one failure abort the whole job
    }
  }

  console.log(`[cron/midnight] Done — ${processed} processed, ${errors} errors`)
  return NextResponse.json({ processed, errors })
})
