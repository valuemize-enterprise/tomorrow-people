import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { getUserById } from "@/lib/services/auth.service"
import {
  getOrInitJournalEntry,
  saveJournalEntry,
  getRecentJournalEntries,
} from "@/lib/services/journal.service"

// GET /api/journal
// ?history=true  → returns the last 7 entries
// (default)      → returns today's entry + prompt
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const history = searchParams.get("history") === "true"

  const user = await getUserById(session.user.id)
  const timezone = user?.timezone ?? "UTC"

  if (history) {
    const entries = await getRecentJournalEntries(session.user.id)
    return NextResponse.json(entries)
  }

  const data = await getOrInitJournalEntry(session.user.id, timezone)
  return NextResponse.json(data)
}

// POST /api/journal
const saveSchema = z.object({
  body: z.string().min(1, "Write at least one word.").max(5000),
  mood: z.enum(["great", "good", "neutral", "hard", "rough"]).optional(),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

  const raw = await req.json()
  const parsed = saveSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const user = await getUserById(session.user.id)
  const timezone = user?.timezone ?? "UTC"

  const entry = await saveJournalEntry(
    session.user.id,
    parsed.data.body,
    parsed.data.mood,
    timezone,
  )

  return NextResponse.json(entry, { status: 201 })
}
