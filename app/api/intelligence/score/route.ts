import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getUserById } from "@/lib/services/auth.service"
import { recalcDailyScore, getWeeklyScores } from "@/lib/services/scoring.service"

// GET /api/intelligence/score
// Returns today's score breakdown + 7-day weekly trend.
// Also triggers a recalc so the score is always fresh on load.
export async function GET() {
  const session = await auth()
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  const user = await getUserById(session.user.id)
  const timezone = user?.timezone ?? "UTC"

  const [today, weekly] = await Promise.all([
    recalcDailyScore(session.user.id, timezone),
    getWeeklyScores(session.user.id, timezone),
  ])

  return NextResponse.json({ today, weekly })
}
