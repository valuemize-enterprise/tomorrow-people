import { NextResponse, type NextRequest } from "next/server"
import { withAuth } from "@/lib/middleware/api"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { ValidationError } from "@/lib/errors"

const schema = z.object({
  identityStatement:  z.string().min(1).max(300).optional(),
  timezone:           z.string().optional(),
  onboardingAnchor:   z.string().min(2).max(120).optional(),
  onboardingComplete: z.boolean().optional(),
})

export const GET = withAuth(async (_req, { userId }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  return NextResponse.json(user)
})

export const PATCH = withAuth(async (req: NextRequest, { userId }) => {
  const body   = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success)
    throw new ValidationError("Validation failed", parsed.error.flatten().fieldErrors)
  const user = await prisma.user.update({ where: { id: userId }, data: parsed.data })
  return NextResponse.json(user)
})
