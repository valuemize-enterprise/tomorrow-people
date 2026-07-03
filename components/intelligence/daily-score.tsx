"use client"

import { useId } from "react"
import type { DailyScore, WeeklyScore } from "@/hooks/use-intelligence"

function scoreLabel(total: number) {
  if (total === 100) return { text: "Perfect",     color: "var(--a)",       bg: "var(--al)" }
  if (total >= 80)   return { text: "Strong day",  color: "var(--success)", bg: "var(--success-l)" }
  if (total >= 50)   return { text: "Good start",  color: "var(--i1)",      bg: "var(--s2)" }
  if (total >= 20)   return { text: "Building",    color: "var(--i2)",      bg: "var(--s2)" }
  return               { text: "Just begin",  color: "var(--i3)",      bg: "var(--s2)" }
}

function ringColor(total: number) {
  if (total >= 80) return "var(--success)"
  if (total >= 50) return "var(--i1)"
  return "var(--s3)"
}

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"]

export function DailyScoreCard({ score, weekly }: { score: DailyScore; weekly: WeeklyScore }) {
  const gradId = useId()
  const { text, color, bg } = scoreLabel(score.total)
  const r    = 34
  const circ = 2 * Math.PI * r
  const dash = circ - (Math.min(score.total, 100) / 100) * circ
  const ring = ringColor(score.total)

  return (
    <div className="card p-5 space-y-4">

      {/* ── Score row ───────────────────────────────────────────── */}
      <div className="flex items-center gap-5">

        {/* Ring */}
        <div className="relative shrink-0" style={{ width: 80, height: 80 }}>
          <svg width="80" height="80" viewBox="0 0 80 80" className="overflow-visible" style={{ transform: "rotate(-90deg)" }} role="img" aria-label={`Daily score: ${score.total} out of 100`}>
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={ring} stopOpacity="0.6" />
                <stop offset="100%" stopColor={ring} />
              </linearGradient>
            </defs>
            {/* Track */}
            <circle cx="40" cy="40" r={r} fill="none" stroke="var(--s2)" strokeWidth="6" />
            {/* Progress */}
            <circle
              cx="40" cy="40" r={r}
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={dash}
              style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.34,1.1,0.64,1)" }}
            />
          </svg>
          {/* Score number */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span
              className="tabular-nums leading-none"
              style={{ fontFamily: "var(--font-display)", fontSize: "22px", color: "var(--i1)" }}
            >
              {score.total}
            </span>
            <span className="type-label" style={{ fontSize: "9px", letterSpacing: "0.08em" }}>pts</span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <span
              className="badge text-[11px]"
              style={{ background: bg, color }}
            >
              {text}
            </span>
          </div>
          <ScoreLine label="Habits"      pts={score.completionPoints} max={60} color="var(--i1)" />
          <ScoreLine label="Streak"      pts={score.streakBonus}      max={25} color="var(--a)" />
          <ScoreLine label="Journal"     pts={score.journalBonus}     max={10} color="var(--success)" />
          <ScoreLine label="Consistency" pts={score.consistencyBonus} max={10} color="var(--i2)" />
        </div>
      </div>

      {/* ── Divider ─────────────────────────────────────────────── */}
      <div style={{ height: "0.5px", background: "var(--s3)" }} />

      {/* ── Weekly sparkline ─────────────────────────────────────── */}
      <div>
        <div className="flex justify-between items-baseline mb-3">
          <span className="type-label">This week</span>
          <span className="type-small">
            avg {weekly.weeklyAverage} · best {weekly.bestDay}
          </span>
        </div>
        <Sparkline days={weekly.days} />
      </div>
    </div>
  )
}

function ScoreLine({
  label, pts, max, color,
}: {
  label: string; pts: number; max: number; color: string
}) {
  if (!pts) return null
  return (
    <div className="flex items-center gap-2">
      <span className="type-small shrink-0" style={{ width: "72px" }}>{label}</span>
      <div className="progress-track flex-1" style={{ height: "3px" }}>
        <div
          className="progress-fill"
          style={{
            width: `${(pts / max) * 100}%`,
            background: color,
            height: "3px",
          }}
        />
      </div>
      <span className="type-small tabular-nums" style={{ width: "28px", textAlign: "right", color: "var(--i2)" }}>
        +{pts}
      </span>
    </div>
  )
}

function Sparkline({ days }: { days: { date: string | Date; total: number }[] }) {
  const max = Math.max(...days.map((d) => d.total), 1)

  return (
    <div className="flex items-end gap-1.5" style={{ height: 44 }}>
      {days.map((day, i) => {
        const pct     = Math.max((day.total / max) * 100, 4)
        const isToday = i === days.length - 1
        const d       = new Date(day.date)
        const name    = DAY_LABELS[d.getDay()]

        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-1"
            title={`${name}: ${day.total} pts`}
          >
            {/* Bar */}
            <div className="w-full flex flex-col justify-end" style={{ height: 30 }}>
              <div
                className="w-full rounded-[3px] transition-all duration-500"
                style={{
                  height: `${pct}%`,
                  background: isToday ? "var(--i1)" : day.total > 0 ? "var(--s3)" : "var(--s2)",
                }}
              />
            </div>
            {/* Day label */}
            <span
              style={{
                fontSize: "10px",
                lineHeight: 1,
                fontWeight: isToday ? "600" : "400",
                color: isToday ? "var(--i1)" : "var(--i3)",
              }}
            >
              {name}
            </span>
          </div>
        )
      })}
    </div>
  )
}
