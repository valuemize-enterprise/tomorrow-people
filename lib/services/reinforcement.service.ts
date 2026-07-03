// Server-only.
// Generates a single reinforcement message based on the user's
// current state. Messages are context-aware — not generic.
// One message per session, never repeated on the same day.

import { prisma } from "@/lib/prisma"
import { startOfDay } from "date-fns"
import { toZonedTime } from "date-fns-tz"

// ─── Message types ─────────────────────────────────────────────────

export type ReinforcementType =
  | "FIRST_COMPLETION"   // very first habit logged on the app ever
  | "PERFECT_DAY"        // all habits done today
  | "MILESTONE_7"        // any habit hit 7-day streak
  | "MILESTONE_21"       // any habit hit 21-day streak
  | "MILESTONE_66"       // any habit hit 66-day streak — identity lock-in
  | "RECOVERY_SUCCESS"   // user logged at least one completion after a miss
  | "CONSISTENCY_HIGH"   // identity score crossed 80% today
  | "STREAK_AT_RISK"     // user hasn't logged yet and it's after 6pm local
  | "ENCOURAGEMENT"      // fallback — general positive signal

export type ReinforcementMessage = {
  type: ReinforcementType
  headline: string
  body: string
  emoji: string
  // If true, show as a persistent card (not a dismissible toast)
  isPersistent: boolean
}

// ─── Message bank ──────────────────────────────────────────────────
// Each type has a pool — one is selected based on vote count to vary messages.

const MESSAGES: Record<ReinforcementType, Omit<ReinforcementMessage, "type">[]> = {
  FIRST_COMPLETION: [
    {
      headline: "First vote cast.",
      body: "You just proved something to yourself. Keep the chain alive.",
      emoji: "🗳️",
      isPersistent: true,
    },
  ],
  PERFECT_DAY: [
    {
      headline: "Chain complete.",
      body: "Every vote counts. The person you're becoming just got a little more real.",
      emoji: "🏆",
      isPersistent: true,
    },
    {
      headline: "Full stack. No excuses needed.",
      body: "This is what a system working looks like.",
      emoji: "⚡",
      isPersistent: true,
    },
  ],
  MILESTONE_7: [
    {
      headline: "7 days straight.",
      body: "One week. The habit is beginning to wire into your brain. Don't stop now.",
      emoji: "🔥",
      isPersistent: true,
    },
  ],
  MILESTONE_21: [
    {
      headline: "21 days. It's becoming automatic.",
      body: "Neuroscience confirms: you're past the hardest part. The habit is forming.",
      emoji: "🧠",
      isPersistent: true,
    },
  ],
  MILESTONE_66: [
    {
      headline: "66 days. This is who you are now.",
      body: "Not what you're trying to do — who you are. The identity shift is complete.",
      emoji: "🪞",
      isPersistent: true,
    },
  ],
  RECOVERY_SUCCESS: [
    {
      headline: "Back. That's what matters.",
      body: "Missing one day tests discipline. Coming back proves identity. You proved it.",
      emoji: "↩️",
      isPersistent: false,
    },
    {
      headline: "The chain is alive.",
      body: "The rule was never miss twice. You didn't.",
      emoji: "⛓️",
      isPersistent: false,
    },
  ],
  CONSISTENCY_HIGH: [
    {
      headline: "80% consistent.",
      body: "You don't need to be perfect. You just need to be this.",
      emoji: "📈",
      isPersistent: false,
    },
  ],
  STREAK_AT_RISK: [
    {
      headline: "Your streak is waiting.",
      body: "Even 2 minutes counts. Don't let the chain break over nothing.",
      emoji: "⏰",
      isPersistent: false,
    },
  ],
  ENCOURAGEMENT: [
    {
      headline: "Small actions compound.",
      body: "Every completion you log today is a vote for the person you're becoming.",
      emoji: "🌱",
      isPersistent: false,
    },
    {
      headline: "Systems over motivation.",
      body: "You don't need to feel like it. You just need to start.",
      emoji: "⚙️",
      isPersistent: false,
    },
  ],
}

// ─── Context-aware message selection ──────────────────────────────

export async function getReinforcementMessage(
  userId: string,
  timezone = "UTC",
): Promise<ReinforcementMessage> {
  const localNow = toZonedTime(new Date(), timezone)
  const todayDate = startOfDay(localNow)

  const [habits, todayLogs, allTimeLogs] = await Promise.all([
    prisma.habit.findMany({
      where: { userId, isActive: true },
      include: { streak: true },
    }),
    prisma.dailyLog.findMany({
      where: { userId, date: todayDate, status: { in: ["DONE", "PARTIAL"] } },
    }),
    prisma.dailyLog.count({
      where: { userId, status: { in: ["DONE", "PARTIAL"] } },
    }),
  ])

  const totalHabits = habits.length
  const completedToday = todayLogs.length
  const hour = localNow.getHours()

  // ── Evaluate in priority order ────────────────────────────────────

  // 1. Identity milestone — check streaks
  const longestCurrentStreak = Math.max(
    0,
    ...habits.map((h) => h.streak?.current ?? 0),
  )
  if (longestCurrentStreak >= 66) return pick("MILESTONE_66")
  if (longestCurrentStreak >= 21) return pick("MILESTONE_21")
  if (longestCurrentStreak >= 7) return pick("MILESTONE_7")

  // 2. Perfect day
  if (totalHabits > 0 && completedToday === totalHabits) {
    return pick("PERFECT_DAY")
  }

  // 3. Very first ever completion
  if (allTimeLogs === 1) return pick("FIRST_COMPLETION")

  // 4. Recovery success — completed something today after yesterday was missed
  if (completedToday > 0) {
    const yesterdayCompletions = await prisma.dailyLog.count({
      where: {
        userId,
        date: new Date(todayDate.getTime() - 86_400_000),
        status: { in: ["DONE", "PARTIAL"] },
      },
    })
    if (yesterdayCompletions === 0) return pick("RECOVERY_SUCCESS")
  }

  // 5. Streak at risk — late in the day with nothing logged
  if (hour >= 18 && completedToday === 0 && totalHabits > 0) {
    return pick("STREAK_AT_RISK")
  }

  // 6. Fallback
  return pick("ENCOURAGEMENT")
}

// ─── Utility ──────────────────────────────────────────────────────

function pick(type: ReinforcementType): ReinforcementMessage {
  const pool = MESSAGES[type]
  // Rotate through pool rather than always showing the first
  const index = Math.floor(Date.now() / 86_400_000) % pool.length
  return { type, ...pool[index] }
}
