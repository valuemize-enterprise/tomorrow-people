"use client"
import { useIntelligence } from "@/hooks/use-intelligence"
import { DailyScoreCard } from "@/components/intelligence/daily-score"
import { StreakDisplay } from "@/components/progress/streak-display"
import { useHabits } from "@/hooks/use-habits"

export default function ProgressPage() {
  const { score, weekly, loading: intelLoading } = useIntelligence()
  const { habits, loading: habitsLoading } = useHabits()

  return (
    <div className="min-h-dvh" style={{ background: "var(--s0)" }}>
      <div className="max-w-lg mx-auto px-4 pt-8 pb-6 space-y-4">
        <h1 style={{ fontFamily:"var(--font-display)",fontSize:"22px",color:"var(--ink)" }}>Progress</h1>
        {intelLoading ? <div className="skeleton h-40" /> : score && weekly && <DailyScoreCard score={score} weekly={weekly} />}
        {!habitsLoading && habits.map(h => h.streak && (
          <StreakDisplay key={h.id} habitName={h.name} current={h.streak.current} longest={h.streak.longest} totalVotes={h.streak.totalVotes} />
        ))}
      </div>
    </div>
  )
}
