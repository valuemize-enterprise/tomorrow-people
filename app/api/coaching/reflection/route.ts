import { NextResponse, type NextRequest } from "next/server"
import { withAuth } from "@/lib/middleware/api"
import { buildCoachingContext, enrichWithJournal } from "@/lib/services/context.service"
import { streamReflectionFeedback } from "@/lib/services/coaching.service"
import { getUserById } from "@/lib/services/auth.service"

/**
 * POST /api/coaching/reflection
 *
 * Called immediately after a journal entry is saved.
 * Returns a streaming text response — the coach responds in real time
 * as tokens arrive from Claude, giving the user a "coach is typing"
 * experience rather than a blank → appear moment.
 *
 * Body: { journalEntryId: string }  (optional — uses today's entry if omitted)
 */
export const POST = withAuth(async (_req: NextRequest, { userId }) => {
  const user     = await getUserById(userId)
  const timezone = user?.timezone ?? "UTC"

  // Build context + inject today's journal entry
  const baseCtx = await buildCoachingContext(userId)
  const ctx     = await enrichWithJournal(baseCtx, userId, timezone)

  if (!ctx.journalEntry?.body) {
    return NextResponse.json(
      { error: "No journal entry found for today" },
      { status: 404 },
    )
  }

  // Stream Claude's response directly to the client
  const stream = await streamReflectionFeedback(ctx)

  return new Response(stream, {
    headers: {
      "Content-Type":      "text/event-stream",
      "Cache-Control":     "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  })
})
