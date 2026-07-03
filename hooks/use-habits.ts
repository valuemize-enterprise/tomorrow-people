"use client"

import { useState, useEffect, useCallback } from "react"

// ─── Types ────────────────────────────────────────────────────────

export type Streak = {
  current: number
  longest: number
  totalVotes: number
}

export type Habit = {
  id: string
  name: string
  anchorHabit: string
  minVersion: string
  attractiveLink?: string | null
  cueDescription?: string | null
  rewardDescription?: string | null
  stackOrder: number
  frictionScore: number
  streak: Streak | null
}

export type TodayLog = {
  habitId: string
  status: "DONE" | "PARTIAL" | "SKIPPED"
  completedAt: string | null
}

export type LogStatus = "DONE" | "PARTIAL" | "SKIPPED" | null

// ─── useHabits ────────────────────────────────────────────────────

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHabits = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/habits")
      if (!res.ok) throw new Error("Failed to load habits")
      const data = await res.json()
      setHabits(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchHabits() }, [fetchHabits])

  return { habits, loading, error, refresh: fetchHabits }
}

// ─── useTodayLogs ─────────────────────────────────────────────────

export function useTodayLogs() {
  const [logs, setLogs] = useState<Record<string, TodayLog>>({})
  const [loading, setLoading] = useState(true)

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/logs/today")
      if (!res.ok) return
      const data: TodayLog[] = await res.json()
      const map = data.reduce<Record<string, TodayLog>>((acc, l) => {
        acc[l.habitId] = l
        return acc
      }, {})
      setLogs(map)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const submitLog = useCallback(
    async (
      habitId: string,
      status: "DONE" | "PARTIAL" | "SKIPPED",
      minutesSpent?: number,
    ) => {
      // Optimistic update — UI reflects immediately
      setLogs((prev) => ({
        ...prev,
        [habitId]: { habitId, status, completedAt: new Date().toISOString() },
      }))

      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitId, status, minutesSpent }),
      })

      if (!res.ok) {
        // Rollback on failure
        setLogs((prev) => {
          const next = { ...prev }
          delete next[habitId]
          return next
        })
        return null
      }

      const data = await res.json()
      return data as { log: TodayLog; streak: Streak }
    },
    [],
  )

  return { logs, loading, submitLog, refresh: fetchLogs }
}

// ─── useCreateHabit ───────────────────────────────────────────────

type CreateHabitPayload = {
  name: string
  anchorHabit: string
  minVersion: string
  attractiveLink?: string
  cueDescription?: string
  rewardDescription?: string
}

export function useCreateHabit(onSuccess?: () => void) {
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const createHabit = useCallback(
    async (payload: CreateHabitPayload): Promise<Habit | null> => {
      setSubmitting(true)
      setErrors({})
      try {
        const res = await fetch("/api/habits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        const data = await res.json()

        if (!res.ok) {
          setErrors(data.issues ?? { _: ["Something went wrong"] })
          return null
        }

        onSuccess?.()
        return data as Habit
      } finally {
        setSubmitting(false)
      }
    },
    [onSuccess],
  )

  return { createHabit, submitting, errors }
}
