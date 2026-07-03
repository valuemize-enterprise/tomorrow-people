// Server-only.
// Calculates and persists a user's daily score.
// Called after every log submission and journal save.

import { prisma } from "@/lib/prisma"
import { startOfDay, subDays } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { getIdentityScore } from "@/lib/services/progress.service"

// ─── Score weights ─────────────────────────────────────────────────
const POINTS = {
  DONE: 15,       // full completion
  PARTIAL: 8,     // 2-min minimum counts
  STREAK_BONUS: 5, // per habit currently at a milestone streak (7/21/66)
  JOURNAL: 10,    // wrote a journal entry today
  CONSISTENCY: 10, // identity score ≥ 80%
  MAX: 100,
} as const

const MILESTONES = [7, 21, 66]

// ─── Main calculation ──────────────────────────────────────────────

export async function recalcDailyScore(userId: string, timezone = "UTC") {
  const localNow = toZonedTime(new Date(), timezone)
  const todayDate = startOfDay(localNow)

  // 1. Completion points — sum up today's logs
  const todayLogs = await prisma.dailyLog.findMany({
    where: { userId, date: todayDate },
    select: { status: true },
  })

  const completionPoints = todayLogs.reduce((sum, log) => {
    if (log.status === "DONE") return sum + POINTS.DONE
    if (log.status === "PARTIAL") return sum + POINTS.PARTIAL
    return sum
  }, 0)

  // 2. Streak bonus — +5 per habit currently sitting at a milestone
  const habits = await prisma.habit.findMany({
    where: { userId, isActive: true },
    include: { streak: { select: { current: true } } },
  })

  const streakBonus = habits.reduce((sum, h) => {
    const current = h.streak?.current ?? 0
    const atMilestone = MILESTONES.some((m) => current >= m)
    return atMilestone ? sum + POINTS.STREAK_BONUS : sum
  }, 0)

  // 3. Journal bonus — did the user write today?
  const journal = await prisma.journalEntry.findUnique({
    where: { userId_date: { userId, date: todayDate } },
    select: { id: true },
  })
  const journalBonus = journal ? POINTS.JOURNAL : 0

  // 4. Consistency bonus — overall identity score ≥ 80
  const { overall } = await getIdentityScore(userId)
  const consistencyBonus = overall >= 80 ? POINTS.CONSISTENCY : 0

  // 5. Total — capped at 100
  const raw = completionPoints + streakBonus + journalBonus + consistencyBonus
  const total = Math.min(raw, POINTS.MAX)

  // 6. Persist (upsert — safe to call multiple times per day)
  const score = await prisma.dailyScore.upsert({
    where: { userId_date: { userId, date: todayDate } },
    update: { completionPoints, streakBonus, journalBonus, consistencyBonus, total },
    create: {
      userId,
      date: todayDate,
      completionPoints,
      streakBonus,
      journalBonus,
      consistencyBonus,
      total,
    },
  })

  return score
}

// ─── Weekly score summary ──────────────────────────────────────────
// Returns the last 7 days of daily scores for sparkline / trend display.

export async function getWeeklyScores(userId: string, timezone = "UTC") {
  const localNow = toZonedTime(new Date(), timezone)
  const sevenDaysAgo = subDays(startOfDay(localNow), 6)

  const scores = await prisma.dailyScore.findMany({
    where: { userId, date: { gte: sevenDaysAgo } },
    orderBy: { date: "asc" },
    select: { date: true, total: true, completionPoints: true, journalBonus: true },
  })

  // Fill gaps with zero-score days so the sparkline always has 7 points
  const map = new Map(scores.map((s) => [s.date.toISOString().split("T")[0], s]))
  const result = []
  for (let i = 6; i >= 0; i--) {
    const d = subDays(localNow, i)
    const key = d.toISOString().split("T")[0]
    result.push(map.get(key) ?? { date: d, total: 0, completionPoints: 0, journalBonus: 0 })
  }

  const avg = result.reduce((s, r) => s + r.total, 0) / 7
  const best = Math.max(...result.map((r) => r.total))

  return { days: result, weeklyAverage: Math.round(avg), bestDay: best }
}
