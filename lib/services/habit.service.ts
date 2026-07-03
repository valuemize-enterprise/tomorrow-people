/**
 * lib/services/habit.service.ts
 *
 * FIX: createHabit previously used the array-form $transaction, which
 * ran the Streak INSERT without the Habit ID being guaranteed.
 * Now uses the callback form (interactive transaction) which runs
 * both operations inside a single DB transaction atomically.
 */

import { prisma } from "@/lib/prisma"
import { NotFoundError } from "@/lib/errors"
import type { CreateHabitInput, UpdateHabitInput } from "@/lib/validators/habit.schema"

// ─── Create ───────────────────────────────────────────────────────

export async function createHabit(userId: string, data: CreateHabitInput) {
  const stackOrder =
    data.stackOrder ??
    (await prisma.habit.count({ where: { userId, isActive: true } }))

  // FIX: Use interactive transaction (callback form) so Habit and Streak
  // are created atomically. The array form cannot reference the Habit.id
  // for the Streak.habitId foreign key — this was a silent race condition.
  return prisma.$transaction(async (tx) => {
    const habit = await tx.habit.create({
      data: {
        userId,
        name:              data.name,
        anchorHabit:       data.anchorHabit,
        minVersion:        data.minVersion,
        attractiveLink:    data.attractiveLink ?? null,
        cueDescription:    data.cueDescription ?? null,
        rewardDescription: data.rewardDescription ?? null,
        stackOrder,
      },
    })

    await tx.streak.create({
      data: { habitId: habit.id },
    })

    return habit
  })
}

// ─── Read ─────────────────────────────────────────────────────────

export async function getHabitsByUser(userId: string) {
  return prisma.habit.findMany({
    where:   { userId, isActive: true },
    include: { streak: true },
    orderBy: { stackOrder: "asc" },
  })
}

export async function getHabitById(habitId: string, userId: string) {
  const habit = await prisma.habit.findFirst({
    where:   { id: habitId, userId },
    include: { streak: true },
  })
  if (!habit) throw new NotFoundError("Habit not found")
  return habit
}

// ─── Update ───────────────────────────────────────────────────────

export async function updateHabit(
  habitId: string,
  userId: string,
  data: UpdateHabitInput,
) {
  // Guard: ownership check before update
  const existing = await prisma.habit.findFirst({
    where: { id: habitId, userId },
  })
  if (!existing) throw new NotFoundError("Habit not found")

  return prisma.habit.update({
    where:   { id: habitId },
    data,
    include: { streak: true },
  })
}

// ─── Soft delete ──────────────────────────────────────────────────

export async function deactivateHabit(habitId: string, userId: string) {
  const existing = await prisma.habit.findFirst({
    where: { id: habitId, userId },
  })
  if (!existing) throw new NotFoundError("Habit not found")

  return prisma.habit.update({
    where: { id: habitId },
    data:  { isActive: false },
  })
}

// ─── Reorder ──────────────────────────────────────────────────────

export async function reorderHabits(userId: string, orderedIds: string[]) {
  // FIX: verify every ID belongs to this user before reordering.
  // Previously, any valid habit ID could be reordered by any user.
  const owned = await prisma.habit.findMany({
    where:  { userId, id: { in: orderedIds }, isActive: true },
    select: { id: true },
  })

  const ownedSet    = new Set(owned.map((h) => h.id))
  const safeIds     = orderedIds.filter((id) => ownedSet.has(id))

  const updates = safeIds.map((id, index) =>
    prisma.habit.update({
      where: { id },
      data:  { stackOrder: index },
    }),
  )

  return prisma.$transaction(updates)
}
