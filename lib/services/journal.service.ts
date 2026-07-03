// Server-only.
import { prisma } from "@/lib/prisma"
import { startOfDay } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { recalcDailyScore } from "@/lib/services/scoring.service"

// ─── Prompt rotation ───────────────────────────────────────────────
// 4-day rotating cycle. Deterministic from date so all users on the
// same day see the same type (useful if we add partner sharing later).

type PromptKey = "reflection" | "obstacle" | "gratitude" | "identity"

const PROMPTS: Record<PromptKey, string> = {
  reflection:
    "What went well today — even one small thing?",
  obstacle:
    "What made today hard? What would remove that friction tomorrow?",
  gratitude:
    "What are you grateful for about the person you're becoming?",
  identity:
    "Finish this sentence: Today I proved I am someone who…",
}

export function getTodayPrompt(date = new Date()): { key: PromptKey; text: string } {
  const dayIndex = Math.floor(date.getTime() / 86_400_000) % 4
  const keys = Object.keys(PROMPTS) as PromptKey[]
  const key = keys[dayIndex]
  return { key, text: PROMPTS[key] }
}

// ─── CRUD ─────────────────────────────────────────────────────────

export async function getOrInitJournalEntry(userId: string, timezone = "UTC") {
  const localNow = toZonedTime(new Date(), timezone)
  const todayDate = startOfDay(localNow)
  const prompt = getTodayPrompt(localNow)

  // Return existing entry if the user already wrote today
  const existing = await prisma.journalEntry.findUnique({
    where: { userId_date: { userId, date: todayDate } },
  })
  if (existing) return { entry: existing, prompt, isNew: false }

  return { entry: null, prompt, isNew: true }
}

export async function saveJournalEntry(
  userId: string,
  body: string,
  mood: string | undefined,
  timezone = "UTC",
) {
  if (!body.trim()) throw new Error("Journal body cannot be empty")

  const localNow = toZonedTime(new Date(), timezone)
  const todayDate = startOfDay(localNow)
  const prompt = getTodayPrompt(localNow)

  const entry = await prisma.journalEntry.upsert({
    where: { userId_date: { userId, date: todayDate } },
    update: { body: body.trim(), mood: mood ?? null },
    create: {
      userId,
      date: todayDate,
      promptKey: prompt.key,
      promptText: prompt.text,
      body: body.trim(),
      mood: mood ?? null,
    },
  })

  // Writing a journal entry grants the 10-point journal bonus — recalc score
  await recalcDailyScore(userId, timezone)

  return entry
}

export async function getRecentJournalEntries(userId: string, limit = 7) {
  return prisma.journalEntry.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: limit,
    select: {
      id: true,
      date: true,
      promptText: true,
      body: true,
      mood: true,
    },
  })
}
