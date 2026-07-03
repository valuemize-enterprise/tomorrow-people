"use client"

/**
 * hooks/use-ai-coach.ts
 * FIX: useState(() => { load() }) never worked — useState's initializer
 * is synchronous and cannot trigger async side-effects.
 * Replaced with useEffect(() => { load() }, []) which correctly fires
 * after mount and triggers re-renders when data arrives.
 */

import { useState, useEffect, useCallback, useRef } from "react"

export type ChatRole    = "user" | "assistant"
export type ChatMessage = {
  id:        string
  role:      ChatRole
  content:   string
  streaming?: boolean
  timestamp: Date
  error?:    boolean   // FIX: flag messages that failed so UI can show a retry
}

export type InsightsData = {
  dailyMessage:   string
  messageType:    string
  weeklyAnalysis: string | null
  atRisk:         { name: string; frictionScore: number; completionRate7d: number }[]
  milestones:     { habitName: string; days: number }[]
  summary: {
    consecutiveMissDays:  number
    todayCompleted:       number
    todayTotal:           number
    todayScore:           number
    weeklyAvgScore:       number
    longestCurrentStreak: number
  }
}

// ─── useAICoach ────────────────────────────────────────────────────

export function useAICoach() {
  const [messages,  setMessages]  = useState<ChatMessage[]>([])
  const [streaming, setStreaming] = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const streamingIdRef = useRef<string | null>(null)
  const abortRef       = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (userText: string) => {
    if (!userText.trim() || streaming) return
    setError(null)

    const userMsg: ChatMessage = {
      id:        crypto.randomUUID(),
      role:      "user",
      content:   userText.trim(),
      timestamp: new Date(),
    }

    const assistantId = crypto.randomUUID()
    streamingIdRef.current = assistantId

    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantId, role: "assistant", content: "", streaming: true, timestamp: new Date() },
    ])
    setStreaming(true)

    // Build history for the API
    const history = [...messages, userMsg]
      .filter((m) => !m.error && m.content)
      .map(({ role, content }) => ({ role, content }))

    try {
      const controller = new AbortController()
      abortRef.current = controller

      const res = await fetch("/api/ai/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ messages: history }),
        signal:  controller.signal,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `Error ${res.status} — please try again`)
      }

      if (!res.body) throw new Error("The coach returned an empty response.")

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let accum     = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })

        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue
          const raw = line.slice(6).trim()
          if (raw === "[DONE]") continue
          try {
            const event = JSON.parse(raw)
            if (event.type === "content_block_delta") {
              accum += event.delta?.text ?? ""
              const id = streamingIdRef.current
              setMessages((prev) =>
                prev.map((m) => (m.id === id ? { ...m, content: accum } : m)),
              )
            }
          } catch { /* ignore malformed chunks */ }
        }
      }

      // Mark done
      const id = streamingIdRef.current
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, streaming: false } : m)),
      )
    } catch (err) {
      const msg = err instanceof Error && err.name !== "AbortError"
        ? err.message
        : "Connection interrupted. Please try again."

      if ((err as Error).name !== "AbortError") {
        setError(msg)
        const id = streamingIdRef.current
        // FIX: Mark failed message with error flag instead of removing it
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id
              ? { ...m, streaming: false, error: true, content: "⚠ " + msg }
              : m,
          ),
        )
      }
    } finally {
      setStreaming(false)
      streamingIdRef.current = null
      abortRef.current = null
    }
  }, [messages, streaming])

  const cancelStream = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return { messages, streaming, error, sendMessage, cancelStream, clearMessages }
}

// ─── useInsights ───────────────────────────────────────────────────

export function useInsights() {
  const [data,    setData]    = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/ai/insights")
      if (!res.ok) throw new Error("Could not load your coaching insights")
      setData(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [])

  // FIX: was useState(() => { load() }) — an async call inside useState's
  // synchronous initialiser never triggered re-renders. Now correctly
  // fires after mount via useEffect.
  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, reload: load }
}
