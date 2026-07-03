/**
 * lib/services/coaching.service.ts
 * FIX: habitId ?? "" caused Prisma @@unique constraint collisions.
 * The DB schema stores NULL for non-habit messages; the unique index
 * must allow multiple NULLs (PostgreSQL does this automatically).
 * Updated setCached() to use null, not "".
 */

import { prisma } from "@/lib/prisma"
import {
  buildMorningPrompt, buildRecoveryPrompt, buildMilestonePrompt,
  buildReflectionPrompt, buildAnalysisPrompt, buildHabitRecommendationPrompt,
  type CoachingContext,
} from "@/lib/prompts/coaching.prompts"
import { chat, streamChat } from "@/lib/services/ai-chat.service"

type CoachingType =
  | "MORNING" | "RECOVERY"
  | "MILESTONE_7" | "MILESTONE_21" | "MILESTONE_66"
  | "REFLECTION" | "ANALYSIS" | "RECOMMENDATION"

// ─── Cache ────────────────────────────────────────────────────────

async function getCached(
  userId: string,
  type:   CoachingType,
  habitId?: string | null,    // FIX: explicitly typed as null, not ""
): Promise<string | null> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const record = await prisma.coachingMessage.findFirst({
    where: {
      userId,
      type,
      habitId: habitId ?? null,  // FIX: was habitId ?? ""
      date:    today,
    },
    select: { message: true },
  })

  return record?.message ?? null
}

async function setCached(
  userId:  string,
  type:    CoachingType,
  message: string,
  habitId?: string | null,
): Promise<void> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  try {
    await prisma.coachingMessage.upsert({
      where: {
        userId_type_date_habitId: {
          userId,
          type,
          date:    today,
          habitId: habitId ?? null,   // FIX: null, not ""
        },
      },
      update: { message },
      create: { userId, type, date: today, message, habitId: habitId ?? null },
    })
  } catch (err) {
    // Cache failure is non-fatal — log it and continue
    console.error("[coaching] Cache write failed (non-fatal):", err)
  }
}

// ─── Public coaching functions ────────────────────────────────────

export async function getDailyCoachingMessage(
  ctx: CoachingContext, userId: string,
): Promise<{ message: string; type: CoachingType }> {
  const type: CoachingType = ctx.consecutiveMissDays >= 2 ? "RECOVERY" : "MORNING"

  const cached = await getCached(userId, type)
  if (cached) return { message: cached, type }

  const prompt  = type === "RECOVERY" ? buildRecoveryPrompt(ctx) : buildMorningPrompt(ctx)
  const message = await chat({ messages: [{ role: "user", content: "Generate my coaching message." }], context: ctx })

  await setCached(userId, type, message)
  return { message, type }
}

export async function getMilestoneMessage(
  ctx: CoachingContext, userId: string,
  habitId: string, habitName: string, milestone: 7 | 21 | 66,
): Promise<string> {
  const type: CoachingType = `MILESTONE_${milestone}` as CoachingType
  const cached = await getCached(userId, type, habitId)
  if (cached) return cached

  const message = await chat({
    messages: [{ role: "user", content: `I just hit ${milestone} days on ${habitName}.` }],
    context:  ctx,
  })

  await setCached(userId, type, message, habitId)
  return message
}

export async function getReflectionFeedback(ctx: CoachingContext): Promise<string> {
  if (!ctx.journalEntry?.body) throw new Error("No journal entry in context")
  return chat({
    messages: [{ role: "user", content: `I just wrote my journal entry: "${ctx.journalEntry.body}"` }],
    context:  ctx,
  })
}

export async function getBehaviourAnalysis(ctx: CoachingContext, userId: string): Promise<string> {
  const cached = await getCached(userId, "ANALYSIS")
  if (cached) return cached

  const message = await chat({
    messages: [{ role: "user", content: "Give me my weekly behaviour analysis." }],
    context:  ctx,
  })

  await setCached(userId, "ANALYSIS", message)
  return message
}

export async function getHabitRecommendation(ctx: CoachingContext, userGoal: string): Promise<string> {
  return chat({
    messages: [{ role: "user", content: `I want to: ${userGoal}` }],
    context:  ctx,
  })
}

export async function streamReflectionFeedback(ctx: CoachingContext): Promise<ReadableStream<Uint8Array>> {
  if (!ctx.journalEntry?.body) throw new Error("No journal entry in context")
  return streamChat({
    messages: [{ role: "user", content: `My journal entry: "${ctx.journalEntry.body}"` }],
    context:  ctx,
  })
}
