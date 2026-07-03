"use client"

import { useState } from "react"
import { useHabits, useTodayLogs } from "@/hooks/use-habits"
import { useIntelligence } from "@/hooks/use-intelligence"
import { HabitStack } from "@/components/habits/habit-stack"
import { HabitForm } from "@/components/habits/habit-form"
import { DailyScoreCard } from "@/components/intelligence/daily-score"
import { RecoveryCard } from "@/components/intelligence/recovery-card"
import { ReinforcementToast } from "@/components/intelligence/reinforcement-toast"
import { JournalEntryWidget } from "@/components/journal/journal-entry"

export default function TodayPage() {
  const { habits, loading: habitsLoading, refresh: refreshHabits } = useHabits()
  const { logs, loading: logsLoading, submitLog } = useTodayLogs()
  const {
    score, weekly, recovery, reinforcement,
    loading: intelLoading, acknowledgeRecovery, refresh: refreshIntel,
  } = useIntelligence()

  const [showForm, setShowForm] = useState(false)
  const loading = habitsLoading || logsLoading

  const knownAnchors = [...new Set(habits.map((h) => h.anchorHabit).filter(Boolean))]

  async function handleLog(habitId: string, status: "DONE" | "PARTIAL" | "SKIPPED") {
    const result = await submitLog(habitId, status)
    if (result) refreshIntel()
    return result
  }

  function handleFormComplete() {
    setShowForm(false)
    refreshHabits()
  }

  const today = new Date()
  const dateStr = today.toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long",
  })

  return (
    <div className="min-h-dvh bg-[var(--surface-0)]">
      <div className="max-w-lg mx-auto px-4 sm:px-6 pt-10 pb-6 space-y-4">

        {/* ── Header ───────────────────────────────────────────── */}
        <header className="animate-fade-up pb-2">
          <p className="t-label text-[var(--ink-tertiary)] mb-1">{dateStr}</p>
          <h1 className="t-title text-[var(--ink-primary)]">{getGreeting()}</h1>
        </header>

        {/* ── Reinforcement toast ───────────────────────────────── */}
        {!intelLoading && reinforcement && (
          <div className="animate-fade-up stagger-1">
            <ReinforcementToast message={reinforcement} />
          </div>
        )}

        {/* ── Recovery card ─────────────────────────────────────── */}
        {!intelLoading && recovery?.tier !== "NONE" && recovery && (
          <div className="animate-fade-up stagger-2">
            <RecoveryCard recovery={recovery} onAcknowledge={acknowledgeRecovery} />
          </div>
        )}

        {/* ── Skeletons ─────────────────────────────────────────── */}
        {loading && <PageSkeleton />}

        {/* ── Habit stack ───────────────────────────────────────── */}
        {!loading && !showForm && (
          <div className="animate-fade-up stagger-2">
            <HabitStack
              habits={habits}
              logs={logs}
              onLog={handleLog}
              onAddHabit={() => setShowForm(true)}
            />
          </div>
        )}

        {/* ── Add habit form ────────────────────────────────────── */}
        {showForm && (
          <div className="card p-5 animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="t-heading">New habit</h2>
              <button
                onClick={() => setShowForm(false)}
                className="btn-ghost w-8 h-8 flex items-center justify-center rounded-full p-0"
                aria-label="Close"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <HabitForm anchors={knownAnchors} onComplete={handleFormComplete} />
          </div>
        )}

        {/* ── Score card ────────────────────────────────────────── */}
        {!intelLoading && score && weekly && (
          <div className="animate-fade-up stagger-3">
            <DailyScoreCard score={score} weekly={weekly} />
          </div>
        )}

        {/* ── Journal ───────────────────────────────────────────── */}
        <div className="animate-fade-up stagger-4">
          <JournalEntryWidget />
        </div>

      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 5)  return "Still up?"
  if (h < 12) return "Good morning."
  if (h < 17) return "Good afternoon."
  if (h < 21) return "Good evening."
  return "Wrapping up?"
}

function PageSkeleton() {
  return (
    <div className="space-y-3 animate-fade-in">
      {[1, 2, 3].map((i) => (
        <div key={i} className={`skeleton h-[86px] stagger-${i}`} />
      ))}
    </div>
  )
}
