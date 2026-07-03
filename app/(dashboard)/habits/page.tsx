"use client"
import { useHabits } from "@/hooks/use-habits"
import { HabitForm } from "@/components/habits/habit-form"
import { StreakDisplay } from "@/components/progress/streak-display"
import { AskCoach } from "@/components/coaching/ask-coach"
import { useState } from "react"
import { useConfirm } from "@/components/ui/confirm-dialog"

export default function HabitsPage() {
  const { habits, loading, refresh } = useHabits()
  const [showForm, setShowForm] = useState(false)
  const { confirm, ConfirmDialog } = useConfirm()

  async function handleDelete(habitId: string, streak: number) {
    const ok = await confirm({
      title: "Remove this habit?",
      body: `This habit has a ${streak}-day streak. Removing it will hide it from your stack. Your history is preserved.`,
      confirmLabel: "Remove habit",
      danger: true,
    })
    if (!ok) return
    await fetch(`/api/habits/${habitId}`, { method: "DELETE" })
    refresh()
  }

  return (
    <div className="min-h-dvh" style={{ background: "var(--s0)" }}>
      <div className="max-w-lg mx-auto px-4 pt-8 pb-6 space-y-5">
        <div className="flex items-center justify-between">
          <h1 style={{ fontFamily:"var(--font-display)",fontSize:"22px",color:"var(--ink)" }}>Your stack</h1>
          <button onClick={() => setShowForm(v => !v)} className="btn btn-secondary btn-sm">
            {showForm ? "Cancel" : "+ New habit"}
          </button>
        </div>
        {showForm && (
          <div className="card p-5">
            <HabitForm anchors={habits.map(h=>h.anchorHabit)} onComplete={()=>{setShowForm(false);refresh()}} />
          </div>
        )}
        {loading && <div className="skeleton h-32" />}
        {!loading && habits.map(h => (
          <div key={h.id} className="space-y-2">
            {h.streak && <StreakDisplay habitName={h.name} current={h.streak.current} longest={h.streak.longest} totalVotes={h.streak.totalVotes} />}
            <button onClick={() => handleDelete(h.id, h.streak?.current ?? 0)} className="type-small" style={{color:"var(--ink3)"}}>Remove from stack</button>
          </div>
        ))}
        <AskCoach />
      </div>
      <ConfirmDialog />
    </div>
  )
}
