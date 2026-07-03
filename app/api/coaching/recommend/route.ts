import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { withAuth } from "@/lib/middleware/api"
import { buildCoachingContext } from "@/lib/services/context.service"
import { getHabitRecommendation } from "@/lib/services/coaching.service"
import { ValidationError } from "@/lib/errors"

const schema = z.object({
  goal: z.string().min(5, "Tell us more about your goal").max(300),
})

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const body   = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success)
    throw new ValidationError("Validation failed", parsed.error.flatten().fieldErrors)
  const ctx     = await buildCoachingContext(userId)
  const message = await getHabitRecommendation(ctx, parsed.data.goal)
  return NextResponse.json({ message })
})
