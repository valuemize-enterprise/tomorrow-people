import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { updateHabitSchema } from "@/lib/validators/habit.schema"
import {
  getHabitById,
  updateHabit,
  deactivateHabit,
} from "@/lib/services/habit.service"

type Params = { params: { id: string } }

// GET /api/habits/:id
export async function GET(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  const habit = await getHabitById(params.id, session.user.id)
  if (!habit) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(habit)
}

// PATCH /api/habits/:id — partial update
export async function PATCH(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  const body = await req.json()
  const parsed = updateHabitSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const habit = await updateHabit(params.id, session.user.id, parsed.data)
  if (!habit) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(habit)
}

// DELETE /api/habits/:id — soft delete (sets isActive = false)
export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  const habit = await deactivateHabit(params.id, session.user.id)
  if (!habit) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({ success: true })
}
