import { prisma } from "@/lib/prisma"
import { startOfDay, subDays, differenceInCalendarDays, format } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import type { CreateLogInput } from "@/lib/validators/habit.schema"

// ─── Log completion ────────────────────────────────────────────────

export async function logCompletion(
  userId: string,
  data: CreateLogInput,
  timezone = "UTC",
) {
  const localNow  = toZonedTime(new Date(), timezone)
  const todayDate = startOfDay(localNow)

  const log = await prisma.dailyLog.upsert({
    where: { habitId_date: { habitId: data.habitId, date: todayDate } },
    update: {
      status:       data.status,
      minutesSpent: data.minutesSpent ?? null,
      completedAt:  data.status !== "SKIPPED" ? new Date() : null,
    },
    create: {
      habitId:      data.habitId,
      userId,
      date:         todayDate,
      status:       data.status,
      minutesSpent: data.minutesSpent ?? null,
      completedAt:  data.status !== "SKIPPED" ? new Date() : null,
    },
  })

  await recalcStreak(data.habitId, timezone)
  return log
}

// ─── Today's logs ─────────────────────────────────────────────────

export async function getTodayLogs(userId: string, timezone = "UTC") {
  const todayDate = startOfDay(toZonedTime(new Date(), timezone))
  return prisma.dailyLog.findMany({
    where: { userId, date: todayDate },
    select: { habitId: true, status: true, completedAt: true },
  })
}

// ─── Streak recalculation ─────────────────────────────────────────
// Rules:
//   DONE | PARTIAL  → completion (streak continues)
//   1 consecutive miss → tolerated ("never miss twice")
//   2+ consecutive misses → streak resets; longest preserved

export async function recalcStreak(habitId: string, timezone = "UTC") {
  const streak = await prisma.streak.findUnique({ where: { habitId } })
  if (!streak) return null

  const logs = await prisma.dailyLog.findMany({
    where: { habitId },
    orderBy: { date: "desc" },
    take: 90,
    select: { date: true, status: true },
  })

  const completedDates = new Set(
    logs
      .filter((l) => l.status === "DONE" || l.status === "PARTIAL")
      .map((l) => format(startOfDay(l.date), "yyyy-MM-dd")),
  )

  const localNow  = toZonedTime(new Date(), timezone)
  const todayStr  = format(startOfDay(localNow), "yyyy-MM-dd")

  // Count current streak walking backwards from today
  let current           = 0
  let consecutiveMisses = 0

  for (let i = 0; i < 90; i++) {
    const d   = subDays(localNow, i)
    const key = format(startOfDay(d), "yyyy-MM-dd")

    if (completedDates.has(key)) {
      current++
      consecutiveMisses = 0
    } else {
      // Skip future dates (shouldn't occur) and treat as non-miss
      if (key > todayStr) continue
      consecutiveMisses++
      if (consecutiveMisses >= 2) break   // streak run is over
    }
  }

  const longest = Math.max(streak.longest, current)

  await prisma.streak.update({
    where: { habitId },
    data: { current, longest, lastUpdated: new Date() },
  })

  return { current, longest }
}

// ─── Vote counter ─────────────────────────────────────────────────
// Called once per fresh DONE/PARTIAL per habit per day.
// Idempotency is enforced in the log route before calling this.

export async function incrementVotes(habitId: string) {
  return prisma.streak.update({
    where: { habitId },
    data: { totalVotes: { increment: 1 } },
  })
}

// ─── Identity score ───────────────────────────────────────────────

export async function getIdentityScore(userId: string) {
  // FIX: cannot mix select + include on Streak — use include only
  const habits = await prisma.habit.findMany({
    where: { userId, isActive: true },
    include: { streak: true },
  })

  const scores = habits.map((h) => {
    const daysSince = Math.max(1, differenceInCalendarDays(new Date(), h.createdAt))
    const raw = ((h.streak?.totalVotes ?? 0) / daysSince) * 100
    return {
      habitId:        h.id,
      habitName:      h.name,
      identityScore:  Math.min(100, Math.round(raw)),
      currentStreak:  h.streak?.current    ?? 0,
      longestStreak:  h.streak?.longest    ?? 0,
      totalVotes:     h.streak?.totalVotes ?? 0,
    }
  })

  const overall =
    scores.length === 0
      ? 0
      : Math.round(scores.reduce((s, h) => s + h.identityScore, 0) / scores.length)

  return { overall, habits: scores }
}

// ─── Progress summary ─────────────────────────────────────────────

export async function getProgressSummary(userId: string, timezone = "UTC") {
  const [identity, todayLogs] = await Promise.all([
    getIdentityScore(userId),
    getTodayLogs(userId, timezone),
  ])

  const totalHabits     = identity.habits.length
  const completedToday  = todayLogs.filter(
    (l) => l.status === "DONE" || l.status === "PARTIAL",
  ).length

  const MILESTONES = [7, 21, 66]
  const milestonesReached = identity.habits.flatMap((h) =>
    MILESTONES.filter((m) => h.currentStreak >= m).map((m) => ({
      habitId:   h.habitId,
      habitName: h.habitName,
      milestone: m,
    })),
  )

  return {
    identityScore:    identity.overall,
    habits:           identity.habits,
    today:            { total: totalHabits, completed: completedToday },
    milestonesReached,
  }
}

// ─── Friction audit (cron) ────────────────────────────────────────

export async function runFrictionAudit(userId: string, timezone = "UTC") {
  const sevenDaysAgo = subDays(toZonedTime(new Date(), timezone), 7)

  const habits = await prisma.habit.findMany({
    where: { userId, isActive: true },
    include: {
      dailyLogs: {
        where: { date: { gte: sevenDaysAgo } },
        select: { status: true },
      },
    },
  })

  const updates = habits
    .map((h) => ({
      habitId: h.id,
      rate: h.dailyLogs.filter(
        (l) => l.status === "DONE" || l.status === "PARTIAL",
      ).length / 7,
    }))
    .filter((h) => h.rate < 0.5)
    .map((h) =>
      prisma.habit.update({
        where: { id: h.habitId },
        data: { frictionScore: { increment: 1 } },
      }),
    )

  if (updates.length > 0) await prisma.$transaction(updates)
  return { audited: habits.length, flagged: updates.length }
}
