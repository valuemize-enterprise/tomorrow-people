import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getUserById } from "@/lib/services/auth.service"
import { getRecoveryState, acknowledgeRecovery } from "@/lib/services/recovery.service"
import { getReinforcementMessage } from "@/lib/services/reinforcement.service"

// GET /api/intelligence/recovery
// Returns recovery tier + reinforcement message for today.
export async function GET() {
  const session = await auth()
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  const user = await getUserById(session.user.id)
  const timezone = user?.timezone ?? "UTC"

  const [recovery, reinforcement] = await Promise.all([
    getRecoveryState(session.user.id, timezone),
    getReinforcementMessage(session.user.id, timezone),
  ])

  return NextResponse.json({ recovery, reinforcement })
}

// POST /api/intelligence/recovery
// Mark the recovery card as acknowledged (user tapped the CTA).
export async function POST() {
  const session = await auth()
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  const user = await getUserById(session.user.id)
  const timezone = user?.timezone ?? "UTC"

  await acknowledgeRecovery(session.user.id, timezone)
  return NextResponse.json({ acknowledged: true })
}
