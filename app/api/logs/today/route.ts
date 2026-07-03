import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getTodayLogs } from "@/lib/services/progress.service"
import { getUserById } from "@/lib/services/auth.service"

// GET /api/logs/today — all habit completion states for the current day
export async function GET() {
  const session = await auth()
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  const user = await getUserById(session.user.id)
  const timezone = user?.timezone ?? "UTC"

  const logs = await getTodayLogs(session.user.id, timezone)
  return NextResponse.json(logs)
}
