import { NextResponse } from "next/server"
import { withAuth } from "@/lib/middleware/api"
import { buildCoachingContext } from "@/lib/services/context.service"
import { getDailyCoachingMessage } from "@/lib/services/coaching.service"

/**
 * GET /api/coaching/daily
 *
 * Returns the daily coaching message for the current user.
 * Message type (morning vs recovery) is determined automatically
 * from the user's consecutiveMissDays.
 *
 * Cached once per day — subsequent calls return the cached version.
 */
export const GET = withAuth(async (_req, { userId }) => {
  const ctx     = await buildCoachingContext(userId)
  const result  = await getDailyCoachingMessage(ctx, userId)

  return NextResponse.json({
    message:               result.message,
    type:                  result.type,
    consecutiveMissDays:   ctx.consecutiveMissDays,
    weeklyAvgScore:        ctx.weeklyAvgScore,
    todayCompleted:        ctx.todayCompleted,
    todayTotal:            ctx.todayTotal,
  })
})
