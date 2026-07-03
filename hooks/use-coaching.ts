"use client"

import { useState, useEffect, useCallback } from "react"

// ─── Types ────────────────────────────────────────────────────────

export type CoachingMessageType =
  | "MORNING" | "RECOVERY"
  | "MILESTONE_7" | "MILESTONE_21" | "MILESTONE_66"
  | "REFLECTION" | "ANALYSIS" | "RECOMMENDATION"

export type DailyCoachingResponse = {
  message:              string
  type:                 CoachingMessageType
  consecutiveMissDays:  number
  weeklyAvgScore:       number
  todayCompleted:       number
  todayTotal:           number
}

// ─── useDailyCoaching ─────────────────────────────────────────────

export function useDailyCoaching() {
  const [data,    setData]    = useState<DailyCoachingResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch("/api/coaching/daily")
        if (!res.ok) throw new Error("Failed to load coaching message")
        const json = await res.json()
        setData(json)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }
    fetch_()
  }, [])

  return { data, loading, error }
}

// ─── useReflectionFeedback ────────────────────────────────────────
// Uses the SSE stream from /api/coaching/reflection.
// Returns streamed text character by character.

export function useReflectionFeedback() {
  const [text,      setText]      = useState("")
  const [streaming, setStreaming] = useState(false)
  const [done,      setDone]      = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const startStream = useCallback(async () => {
    setText("")
    setDone(false)
    setError(null)
    setStreaming(true)

    try {
      const res = await fetch("/api/coaching/reflection", { method: "POST" })

      if (!res.ok) {
        setError("Could not get coaching feedback right now")
        return
      }

      const reader  = res.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done: streamDone, value } = await reader.read()
        if (streamDone) break

        // Parse SSE: each chunk may contain multiple events
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue
          const raw = line.slice(6).trim()
          if (raw === "[DONE]") continue

          try {
            const event = JSON.parse(raw)
            if (event.type === "content_block_delta") {
              setText((prev) => prev + (event.delta?.text ?? ""))
            }
          } catch {
            // Ignore malformed chunks
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Stream error")
    } finally {
      setStreaming(false)
      setDone(true)
    }
  }, [])

  return { text, streaming, done, error, startStream }
}

// ─── useBehaviourAnalysis ─────────────────────────────────────────

export function useBehaviourAnalysis() {
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/coaching/analysis")
      if (!res.ok) throw new Error("Analysis unavailable")
      const data = await res.json()
      setMessage(data.message)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [])

  return { message, loading, error, fetch: fetch_ }
}

// ─── useHabitRecommendation ───────────────────────────────────────

export function useHabitRecommendation() {
  const [message,     setMessage]     = useState<string | null>(null)
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  const recommend = useCallback(async (goal: string): Promise<void> => {
    setSubmitting(true)
    setMessage(null)
    setError(null)

    try {
      const res = await fetch("/api/coaching/recommend", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ goal }),
      })

      if (!res.ok) throw new Error("Could not generate recommendation")
      const data = await res.json()
      setMessage(data.message)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setSubmitting(false)
    }
  }, [])

  return { message, submitting, error, recommend }
}
