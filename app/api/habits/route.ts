import { NextResponse, type NextRequest } from "next/server"
import { withAuth } from "@/lib/middleware/api"
import { createHabitSchema } from "@/lib/validators/habit.schema"
import { createHabit, getHabitsByUser } from "@/lib/services/habit.service"
import { ValidationError } from "@/lib/errors"

export const GET = withAuth(async (_req, { userId }) => {
  const habits = await getHabitsByUser(userId)
  return NextResponse.json(habits)
})

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const body   = await req.json()
  const parsed = createHabitSchema.safeParse(body)

  if (!parsed.success) {
    throw new ValidationError("Validation failed", parsed.error.flatten().fieldErrors)
  }

  const habit = await createHabit(userId, parsed.data)
  return NextResponse.json(habit, { status: 201 })
})
