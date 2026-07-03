import { NextResponse } from "next/server"
import { withAuth } from "@/lib/middleware/api"
import { buildCoachingContext } from "@/lib/services/context.service"
import { getDailyCoachingMessage } from "@/lib/services/coaching.service"
import { getBehaviourAnalysis } from "@/lib/services/coaching.service"

/**
 * GET /api/ai/insights
 *
 * Returns the combined insights panel data:
 *   - daily coaching message (morning or recovery)
 *   - behaviour pattern summary
 *   - at-risk habits (friction > 2 or completion < 50%)
 *   - milestone alerts for today
 *
 * Cached via coaching service — safe to call on every page load.
 */
export const GET = withAuth(async (_req, { userId }) => {
  const ctx = await buildCoachingContext(userId)

  // Daily message and weekly analysis in parallel
  const [dailyResult, weeklyAnalysis] = await Promise.all([
    getDailyCoachingMessage(ctx, userId),
    ctx.weeklyAvgScore > 0 ? getBehaviourAnalysis(ctx, userId) : Promise.resolve(null),
  ])

  // At-risk habits: high friction or low completion
  const atRisk = ctx.activeHabits.filter(
    (h) => h.frictionScore >= 2 || h.completionRate7d < 0.5,
  )

  // Milestones reached today (for any habit currently at 7, 21, or 66 days)
  const MILESTONES = [7, 21, 66]
  const milestones = ctx.activeHabits
    .filter((h) => MILESTONES.includes(h.currentStreak))
    .map((h) => ({ habitName: h.name, days: h.currentStreak }))

  return NextResponse.json({
    dailyMessage:    dailyResult.message,
    messageType:     dailyResult.type,
    weeklyAnalysis,
    atRisk,
    milestones,
    summary: {
      consecutiveMissDays:   ctx.consecutiveMissDays,
      todayCompleted:        ctx.todayCompleted,
      todayTotal:            ctx.todayTotal,
      todayScore:            ctx.todayScore,
      weeklyAvgScore:        ctx.weeklyAvgScore,
      longestCurrentStreak:  ctx.longestCurrentStreak,
    },
  })
})
