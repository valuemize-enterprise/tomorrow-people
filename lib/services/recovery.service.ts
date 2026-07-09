// Server-only.
// Detects missed days, classifies recovery tier, and returns a
// structured recovery action the UI can render without extra logic.

import { prisma } from "@/lib/prisma"
import { startOfDay, subDays, format } from "date-fns"
import { toZonedTime } from "date-fns-tz"

// ─── Recovery tiers ────────────────────────────────────────────────
//
// TIER 1 — "Never miss twice" (1 consecutive miss)
//   → Gentle nudge. Streak still alive. No redesign needed.
//
// TIER 2 — "Shrink it" (2 consecutive misses)
//   → System surfaces the 2-min minimum version of each habit.
//     Streak resets but longest is preserved.
//
// TIER 3 — "Redesign" (3+ consecutive misses)
//   → Full friction audit prompt. Identity reconnection message.
//     User is asked: "Which habit is working? Which needs redesigning?"

export type RecoveryTier = "NONE" | "TIER_1" | "TIER_2" | "TIER_3"

export type RecoveryState = {
  tier: RecoveryTier
  consecutiveMissDays: number
  affectedHabits: {
    id: string
    name: string
    minVersion: string
    frictionScore: number
  }[]
  message: string
  action: string // CTA label
  actionRoute: string // where the CTA navigates
}

// ─── Detect recovery state for a user ─────────────────────────────

export async function getRecoveryState(
  userId: string,
  timezone = "UTC",
): Promise<RecoveryState> {
  const localNow = toZonedTime(new Date(), timezone)
  const today = startOfDay(localNow)

  const habits = await prisma.habit.findMany({
    where: { userId, isActive: true },
    select: {
      id: true,
      name: true,
      minVersion: true,
      frictionScore: true,
      streak: { select: { current: true } },
    },
  })

  if (habits.length === 0) {
    return noRecovery()
  }

  // Count consecutive days with zero completions (all habits missed)
  // Walk backwards from yesterday up to 7 days
  let consecutiveMissDays = 0
  for (let i = 1; i <= 7; i++) {
    const checkDate = subDays(today, i)
    const dateStr = format(checkDate, "yyyy-MM-dd")

    const completionsOnDay = await prisma.dailyLog.count({
      where: {
        userId,
        date: checkDate,
        status: { in: ["DONE", "PARTIAL"] },
      },
    })

    if (completionsOnDay === 0) {
      consecutiveMissDays++
    } else {
      break // streak of misses is interrupted
    }
  }

  if (consecutiveMissDays === 0) return noRecovery()

  // Classify tier
  const tier: RecoveryTier =
    consecutiveMissDays === 1
      ? "TIER_1"
      : consecutiveMissDays === 2
      ? "TIER_2"
      : "TIER_3"

  // Habits with high friction are flagged for Tier 3
  const affectedHabits = habits
    .filter((h) => {
      if (tier === "TIER_3") return true     // flag everything for redesign
      if (tier === "TIER_2") return true     // show all 2-min versions
      return (h.streak?.current ?? 0) === 0  // Tier 1: only zero-streak habits
    })
    .map((h) => ({
      id: h.id,
      name: h.name,
      minVersion: h.minVersion,
      frictionScore: h.frictionScore,
    }))

  const messages: Record<RecoveryTier, string> = {
    NONE: "",
    TIER_1:
      "Yesterday slipped — that's allowed. The rule is simple: never miss twice. Your streak is still alive.",
    TIER_2:
      "Two days missed. Time to shrink the habit, not abandon it. Start with the 2-minute version today.",
    TIER_3:
      "A few days off. The system needs a redesign, not willpower. Which habit is creating the most friction?",
  }

  const actions: Record<RecoveryTier, { label: string; route: string }> = {
    NONE: { label: "", route: "" },
    TIER_1: { label: "Get back on track →", route: "/today" },
    TIER_2: { label: "Start with 2 minutes", route: "/today" },
    TIER_3: { label: "Redesign my habits", route: "/habits" },
  }

  return {
    tier,
    consecutiveMissDays,
    affectedHabits,
    message: messages[tier],
    action: actions[tier].label,
    actionRoute: actions[tier].route,
  }
}

// ─── Mark recovery as acknowledged ────────────────────────────────
// Prevents the same recovery card from reappearing after the user acts.

export async function acknowledgeRecovery(userId: string, timezone = "UTC") {
  const localNow = toZonedTime(new Date(), timezone)
  const todayDate = startOfDay(localNow)

  return prisma.dailyScore.upsert({
    where: { userId_date: { userId, date: todayDate } },
    update: { recoveryTriggered: true },
    create: {
      userId,
      date: todayDate,
      recoveryTriggered: true,
    },
  })
}

// ─── Helpers ──────────────────────────────────────────────────────

function noRecovery(): RecoveryState {
  return {
    tier: "NONE",
    consecutiveMissDays: 0,
    affectedHabits: [],
    message: "",
    action: "",
    actionRoute: "",
  }
}
