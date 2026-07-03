import { z } from "zod"

// ─── Habit ────────────────────────────────────────────────────────

export const createHabitSchema = z.object({
  name: z
    .string()
    .min(2, "Give your habit a name (at least 2 characters)")
    .max(120, "Keep it short — under 120 characters"),

  anchorHabit: z
    .string()
    .min(2, "Tell us what you already do (your anchor)")
    .max(120),

  // Auto-generated on the client; user can edit before submitting
  minVersion: z
    .string()
    .min(2, "What's the 2-minute version of this?")
    .max(200),

  // Optional 4-law enrichment fields
  attractiveLink: z.string().max(200).optional(),
  cueDescription: z.string().max(200).optional(),
  rewardDescription: z.string().max(200).optional(),

  stackOrder: z.number().int().min(0).optional(),
})

export const updateHabitSchema = createHabitSchema
  .partial()                               // every field optional on update
  .extend({
    isActive: z.boolean().optional(),
    frictionScore: z.number().int().min(0).optional(),
    stackOrder: z.number().int().min(0).optional(),
  })

export type CreateHabitInput = z.infer<typeof createHabitSchema>
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>

// ─── Daily log ────────────────────────────────────────────────────

export const createLogSchema = z.object({
  habitId: z.string().cuid("Invalid habit ID"),

  status: z.enum(["DONE", "PARTIAL", "SKIPPED"]),

  // Optional — helps the weekly friction report
  minutesSpent: z.number().int().min(0).max(1440).optional(),
})

export type CreateLogInput = z.infer<typeof createLogSchema>
