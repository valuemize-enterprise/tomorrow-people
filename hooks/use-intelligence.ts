"use client"

import { useState, useEffect, useCallback } from "react"

// ─── Types ────────────────────────────────────────────────────────

export type DailyScore = {
  total: number
  completionPoints: number
  streakBonus: number
  journalBonus: number
  consistencyBonus: number
}

export type WeeklyScore = {
  days: { date: string; total: number }[]
  weeklyAverage: number
  bestDay: number
}

export type RecoveryState = {
  tier: "NONE" | "TIER_1" | "TIER_2" | "TIER_3"
  consecutiveMissDays: number
  affectedHabits: { id: string; name: string; minVersion: string; frictionScore: number }[]
  message: string
  action: string
  actionRoute: string
}

export type ReinforcementMessage = {
  type: string
  headline: string
  body: string
  emoji: string
  isPersistent: boolean
}

export type JournalEntry = {
  id: string
  date: string
  promptText: string
  body: string
  mood: string | null
}

export type JournalPrompt = {
  key: string
  text: string
}

// ─── useIntelligence ──────────────────────────────────────────────
// Loads score + recovery state together (one round-trip each).

export function useIntelligence() {
  const [score, setScore] = useState<DailyScore | null>(null)
  const [weekly, setWeekly] = useState<WeeklyScore | null>(null)
  const [recovery, setRecovery] = useState<RecoveryState | null>(null)
  const [reinforcement, setReinforcement] = useState<ReinforcementMessage | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    const [scoreRes, recoveryRes] = await Promise.all([
      fetch("/api/intelligence/score"),
      fetch("/api/intelligence/recovery"),
    ])

    if (scoreRes.ok) {
      const data = await scoreRes.json()
      setScore(data.today)
      setWeekly(data.weekly)
    }

    if (recoveryRes.ok) {
      const data = await recoveryRes.json()
      setRecovery(data.recovery)
      setReinforcement(data.reinforcement)
    }

    setLoading(false)
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  const acknowledgeRecovery = useCallback(async () => {
    await fetch("/api/intelligence/recovery", { method: "POST" })
    setRecovery(null)
  }, [])

  return { score, weekly, recovery, reinforcement, loading, acknowledgeRecovery, refresh: fetch_ }
}

// ─── useJournal ───────────────────────────────────────────────────

export function useJournal() {
  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [prompt, setPrompt] = useState<JournalPrompt | null>(null)
  const [history, setHistory] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const fetchToday = useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/journal")
    if (res.ok) {
      const data = await res.json()
      setEntry(data.entry)
      setPrompt(data.prompt)
    }
    setLoading(false)
  }, [])

  const fetchHistory = useCallback(async () => {
    const res = await fetch("/api/journal?history=true")
    if (res.ok) setHistory(await res.json())
  }, [])

  useEffect(() => { fetchToday() }, [fetchToday])

  const save = useCallback(
    async (body: string, mood?: string): Promise<JournalEntry | null> => {
      setSaving(true)
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, mood }),
      })
      setSaving(false)
      if (!res.ok) return null
      const saved_ = await res.json()
      setEntry(saved_)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      return saved_
    },
    [],
  )

  return { entry, prompt, history, loading, saving, saved, save, fetchHistory }
}
