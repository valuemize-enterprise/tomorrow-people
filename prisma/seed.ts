/**
 * prisma/seed.ts
 *
 * Seeds a demo user with a realistic 30-day history so new developers
 * can explore the app without manually creating data.
 *
 * Run: npm run db:seed
 *
 * SAFE to re-run — uses upserts throughout, never duplicates data.
 * Do NOT run against a production database with real users.
 */

import { PrismaClient, LogStatus } from "@prisma/client"
import { subDays, startOfDay } from "date-fns"

const prisma = new PrismaClient()

// ── Demo data ─────────────────────────────────────────────────────

const DEMO_USER = {
  email:             "demo@tomorrowspeople.app",
  name:              "Demo User",
  onboardingAnchor:  "make coffee",
  onboardingComplete: true,
  identityStatement: "a person who reads and trains every morning",
  timezone:          "Africa/Lagos",
}

const DEMO_HABITS = [
  {
    name:              "Read",
    anchorHabit:       "make coffee",
    minVersion:        "Read for just 2 minutes",
    attractiveLink:    "With a good coffee in hand",
    cueDescription:    "Book left open on the kitchen table",
    rewardDescription: "10 minutes of any show after",
    stackOrder:        0,
  },
  {
    name:              "Exercise",
    anchorHabit:       "After reading",
    minVersion:        "Exercise for just 2 minutes",
    attractiveLink:    "Morning playlist on",
    cueDescription:    "Workout clothes laid out the night before",
    rewardDescription: "Hot shower after",
    stackOrder:        1,
  },
  {
    name:              "Journal",
    anchorHabit:       "After exercise",
    minVersion:        "Write one sentence",
    attractiveLink:    "Quiet house, good light",
    cueDescription:    "Journal open on desk",
    rewardDescription: "Feeling clear-headed for the day",
    stackOrder:        2,
  },
]

// ── Realistic completion patterns (simulate a real user) ──────────
// Pattern: strong first two weeks, a 2-day miss in week 3, recovery, strong finish

function getStatusForDay(habitIndex: number, daysAgo: number): LogStatus | null {
  // Days 29–22 ago: establishing the habit — mostly done, occasional partial
  if (daysAgo >= 22) {
    if (daysAgo === 28 || daysAgo === 25) return "PARTIAL"
    return "DONE"
  }

  // Days 21–15 ago: strong streak
  if (daysAgo >= 15) return "DONE"

  // Days 14–13 ago: missed two days (recovery scenario)
  if (daysAgo === 14 || daysAgo === 13) {
    return null   // no log — simulates genuine miss
  }

  // Days 12–8 ago: recovery + strong run
  if (daysAgo >= 8) {
    if (daysAgo === 12) return "PARTIAL"   // bounce-back day
    return "DONE"
  }

  // Days 7–2 ago: perfect week building
  if (daysAgo >= 2) return "DONE"

  // Yesterday + today: habit 2 (exercise) not yet done today (index 1)
  if (daysAgo <= 1 && habitIndex === 1) return daysAgo === 1 ? "DONE" : null

  return "DONE"
}

// ── Main seed ─────────────────────────────────────────────────────

async function main() {
  console.log("🌱  Seeding database...")

  // 1. Upsert demo user
  const user = await prisma.user.upsert({
    where:  { email: DEMO_USER.email },
    update: DEMO_USER,
    create: DEMO_USER,
  })
  console.log(`   ✓ User: ${user.email}`)

  // 2. Upsert habits + streaks
  const habits = []
  for (const habitData of DEMO_HABITS) {
    const habit = await prisma.habit.upsert({
      where: {
        // Prisma doesn't support upsert on non-unique fields easily;
        // use a composite check via findFirst + create/update pattern.
        id: `seed-${user.id}-${habitData.stackOrder}`,
      },
      update: habitData,
      create: {
        id: `seed-${user.id}-${habitData.stackOrder}`,
        userId: user.id,
        ...habitData,
      },
    })

    // Upsert streak row
    await prisma.streak.upsert({
      where:  { habitId: habit.id },
      update: {},
      create: { habitId: habit.id },
    })

    habits.push(habit)
    console.log(`   ✓ Habit: ${habit.name}`)
  }

  // 3. Upsert 30 days of daily logs
  let totalLogs = 0
  const today = startOfDay(new Date())

  for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
    const date = startOfDay(subDays(today, daysAgo))

    for (let hi = 0; hi < habits.length; hi++) {
      const status = getStatusForDay(hi, daysAgo)
      if (!status) continue

      await prisma.dailyLog.upsert({
        where: {
          habitId_date: { habitId: habits[hi].id, date },
        },
        update: { status },
        create: {
          habitId:     habits[hi].id,
          userId:      user.id,
          date,
          status,
          completedAt: status !== "SKIPPED" ? date : null,
        },
      })
      totalLogs++
    }
  }
  console.log(`   ✓ Daily logs: ${totalLogs} entries over 30 days`)

  // 4. Recalculate streaks from log data
  for (const habit of habits) {
    // Count DONE + PARTIAL logs
    const completions = await prisma.dailyLog.count({
      where: { habitId: habit.id, status: { in: ["DONE", "PARTIAL"] } },
    })

    // Last completed date
    const lastLog = await prisma.dailyLog.findFirst({
      where:   { habitId: habit.id, status: { in: ["DONE", "PARTIAL"] } },
      orderBy: { date: "desc" },
      select:  { date: true },
    })

    // Simple streak: count backwards from today/yesterday
    let current = 0
    for (let i = 0; i < 30; i++) {
      const d = startOfDay(subDays(today, i))
      const log = await prisma.dailyLog.findUnique({
        where: { habitId_date: { habitId: habit.id, date: d } },
      })
      if (log && (log.status === "DONE" || log.status === "PARTIAL")) {
        current++
      } else {
        if (current > 0 || i > 1) break  // gap found; tolerate 1 miss
      }
    }

    await prisma.streak.update({
      where: { habitId: habit.id },
      data:  {
        current,
        longest:          current,
        totalVotes:       completions,
        lastCompletedDate: lastLog?.date ?? null,
        lastUpdated:       new Date(),
      },
    })
  }
  console.log("   ✓ Streaks calculated")

  // 5. Seed one journal entry (today)
  await prisma.journalEntry.upsert({
    where: { userId_date: { userId: user.id, date: today } },
    update: {},
    create: {
      userId:     user.id,
      date:       today,
      promptKey:  "reflection",
      promptText: "What went well today — even one small thing?",
      body:       "Completed all three habits before 8am. The system is working.",
      mood:       "great",
    },
  })
  console.log("   ✓ Journal entry")

  console.log("\n✅  Seed complete.")
  console.log(`\n   Demo login: ${DEMO_USER.email}`)
  console.log("   (Use the magic link flow — no password needed)\n")
}

main()
  .catch((err) => {
    console.error("❌  Seed failed:", err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
