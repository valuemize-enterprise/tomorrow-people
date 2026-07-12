/**
 * app/api/ai/chat/route.ts
 * FIXES:
 *   1. Wraps streamChat in try/catch — was unguarded, any error crashed with no response
 *   2. Returns user-friendly error JSON instead of unhandled rejection
 *   3. Validates message content length (max 2000 chars) to prevent token abuse
 */

import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { withAuth } from "@/lib/middleware/api"
import { ValidationError } from "@/lib/errors"
import { buildCoachingContext, enrichWithJournal } from "@/lib/services/context.service"
import { streamChat, type ChatMessage } from "@/lib/services/ai-chat.service"
import { getUserById } from "@/lib/services/auth.service"
import { rateLimit, CHAT_LIMIT } from "@/lib/middleware/rate-limit"

const messageSchema = z.object({
  role:    z.enum(["user", "assistant"]),
  // FIX: cap individual message length to prevent token inflation attacks
  content: z.string().min(1).max(2000, "Messages must be under 2000 characters"),
})

const chatSchema = z.object({
  messages: z
    .array(messageSchema)
    .min(1, "At least one message is required")
    .max(40,  "Conversation too long — start a new chat")
    .refine(
      (msgs) => msgs[msgs.length - 1].role === "user",
      "Last message must be from the user",
    ),
  includeJournal: z.boolean().optional().default(false),
})

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  // Per-user rate limit
  const rl = await rateLimit(`chat:${userId}`, CHAT_LIMIT)
  if (!rl.success) {
    return NextResponse.json(
      { error: "You're sending messages too quickly. Wait a moment and try again." },
      { status: 429 },
    )
  }

  const body   = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const parsed = chatSchema.safeParse(body)
  if (!parsed.success) {
    throw new ValidationError("Invalid chat request", parsed.error.flatten().fieldErrors)
  }

  const { messages, includeJournal } = parsed.data

  const user     = await getUserById(userId)
  const timezone = user?.timezone ?? "UTC"

  let ctx = await buildCoachingContext(userId)
  if (includeJournal) ctx = await enrichWithJournal(ctx, userId, timezone)

  // FIX: Wrap stream in try/catch — was unguarded before
  let stream: ReadableStream<Uint8Array>
  try {
    stream = await streamChat({
      messages: messages as ChatMessage[],
      context:  ctx,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not reach the coaching service."
    console.error("[ai/chat] Stream init failed:", err)
    return NextResponse.json({ error: message }, { status: 503 })
  }

  return new NextResponse(stream, {
  headers: {
    "Content-Type":           "text/event-stream",
    "Cache-Control":          "no-cache, no-store",
    "X-Accel-Buffering":      "no",
    "X-Content-Type-Options": "nosniff",
  },
})
})
