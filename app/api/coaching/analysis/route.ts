import { NextResponse } from "next/server"
import { withAuth } from "@/lib/middleware/api"
import { buildCoachingContext } from "@/lib/services/context.service"
import { getBehaviourAnalysis } from "@/lib/services/coaching.service"

/**
 * GET /api/coaching/analysis
 *
 * Returns a weekly behaviour analysis.
 * Normally called by the Saturday cron job.
 * Can also be triggered manually by the user ("What does the data say?").
 *
 * Cached once per day — avoids repeated analysis for the same data.
 */
export const GET = withAuth(async (_req, { userId }) => {
  const ctx     = await buildCoachingContext(userId)
  const message = await getBehaviourAnalysis(ctx, userId)

  return NextResponse.json({
    message,
    weeklyAvgScore: ctx.weeklyAvgScore,
    habitCount:     ctx.activeHabits.length,
    generatedAt:    new Date().toISOString(),
  })
})
