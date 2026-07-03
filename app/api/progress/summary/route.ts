import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getProgressSummary } from "@/lib/services/progress.service"
import { getUserById } from "@/lib/services/auth.service"

// GET /api/progress/summary
export async function GET() {
  const session = await auth()
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  const user = await getUserById(session.user.id)
  const timezone = user?.timezone ?? "UTC"

  const summary = await getProgressSummary(session.user.id, timezone)
  return NextResponse.json(summary)
}
