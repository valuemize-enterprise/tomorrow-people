import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createLogSchema } from "@/lib/validators/habit.schema"
import { logCompletion, incrementVotes } from "@/lib/services/progress.service"
import { recalcDailyScore } from "@/lib/services/scoring.service"
import { getUserById } from "@/lib/services/auth.service"
import { prisma } from "@/lib/prisma"
import { startOfDay } from "date-fns"
import { toZonedTime } from "date-fns-tz"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  const body   = await req.json()
  const parsed = createLogSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const habit = await prisma.habit.findFirst({
    where: { id: parsed.data.habitId, userId: session.user.id, isActive: true },
  })
  if (!habit)
    return NextResponse.json({ error: "Habit not found" }, { status: 404 })

  const user     = await getUserById(session.user.id)
  const timezone = user?.timezone ?? "UTC"

  const localNow  = toZonedTime(new Date(), timezone)
  const todayDate = startOfDay(localNow)

  // Check idempotency before incrementing vote count
  const existingLog = await prisma.dailyLog.findUnique({
    where: { habitId_date: { habitId: parsed.data.habitId, date: todayDate } },
  })
  const wasAlreadyCompleted =
    existingLog?.status === "DONE" || existingLog?.status === "PARTIAL"

  const log = await logCompletion(session.user.id, parsed.data, timezone)

  const isNowCompleted =
    parsed.data.status === "DONE" || parsed.data.status === "PARTIAL"

  if (isNowCompleted && !wasAlreadyCompleted) {
    await incrementVotes(parsed.data.habitId)
  }

  const [dailyScore, streak] = await Promise.all([
    recalcDailyScore(session.user.id, timezone),
    prisma.streak.findUnique({ where: { habitId: parsed.data.habitId } }),
  ])

  return NextResponse.json({ log, streak, dailyScore }, { status: 201 })
}
