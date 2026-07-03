"use client"

import { HabitCard } from "@/components/habits/habit-card"
import type { Habit, TodayLog } from "@/hooks/use-habits"

type Props = {
  habits: Habit[]
  logs: Record<string, TodayLog>
  onLog: (
    habitId: string,
    status: "DONE" | "PARTIAL" | "SKIPPED",
  ) => Promise<any>
  onAddHabit: () => void
}

export function HabitStack({ habits, logs, onLog, onAddHabit }: Props) {
  const total     = habits.length
  const completed = habits.filter((h) => {
    const s = logs[h.id]?.status
    return s === "DONE" || s === "PARTIAL"
  }).length
  const allDone = total > 0 && completed === total

  return (
    <div className="space-y-3">

      {/* Progress header */}
      {total > 0 && (
        <div className="flex items-center justify-between mb-1">
          <span className="t-label text-[var(--ink-tertiary)]">
            {allDone ? "All done" : "Today's stack"}
          </span>
          <span className="t-small text-[var(--ink-tertiary)] tabular-nums">
            {completed} / {total}
          </span>
        </div>
      )}

      {/* Progress track */}
      {total > 0 && (
        <div className="progress-track mb-4">
          <div
            className={`progress-fill ${allDone ? "progress-fill-accent" : ""}`}
            style={{ width: `${(completed / total) * 100}%` }}
          />
        </div>
      )}

      {/* All done */}
      {allDone && (
        <div className="card-accent p-6 text-center animate-scale-in">
          <div className="text-3xl mb-3">🏆</div>
          <p className="t-heading text-[var(--ink-primary)] mb-1">Chain complete.</p>
          <p className="t-small text-[var(--ink-secondary)]">
            Every vote counts. See you tomorrow.
          </p>
        </div>
      )}

      {/* Habit cards — FIX: pass index for stagger animation */}
      {!allDone && habits.map((habit, i) => (
        <HabitCard
          key={habit.id}
          habit={habit}
          log={logs[habit.id]}
          onLog={onLog}
          index={i}               // ← was missing in original version
        />
      ))}

      {/* Empty state */}
      {total === 0 && (
        <div className="card p-8 text-center animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-[var(--surface-2)] flex items-center justify-center mx-auto mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--ink-tertiary)" strokeWidth="1.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <p className="t-heading text-[var(--ink-primary)] mb-1">No habits yet</p>
          <p className="t-small text-[var(--ink-secondary)] mb-5 max-w-[220px] mx-auto">
            Stack your first habit onto something you already do every morning.
          </p>
          <button onClick={onAddHabit} className="btn-primary mx-auto">
            Add first habit
          </button>
        </div>
      )}

      {/* Add button */}
      {total > 0 && !allDone && (
        <button
          onClick={onAddHabit}
          className="
            w-full py-3 rounded-[var(--radius-md)]
            border border-dashed border-[var(--surface-3)]
            t-small text-[var(--ink-tertiary)]
            transition-all duration-150
            hover:border-[var(--ink-tertiary)] hover:text-[var(--ink-secondary)] hover:bg-[var(--surface-2)]
          "
        >
          + Add habit to stack
        </button>
      )}

    </div>
  )
}
