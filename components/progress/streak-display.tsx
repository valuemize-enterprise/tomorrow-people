"use client"

const MILESTONES = [7, 21, 66]

type Props = {
  current: number
  longest: number
  totalVotes: number
  habitName: string
}

export function StreakDisplay({ current, longest, totalVotes, habitName }: Props) {
  const nextMilestone  = MILESTONES.find((m) => m > current)
  const lastMilestone  = [...MILESTONES].reverse().find((m) => m <= current)
  const atMilestone    = MILESTONES.includes(current)
  const pct = nextMilestone
    ? (Math.min(current, nextMilestone) / nextMilestone) * 100
    : 100

  return (
    <div className="card p-4 space-y-4">
      {/* Name */}
      <p className="t-label text-[var(--ink-tertiary)] truncate">{habitName}</p>

      {/* Stats row */}
      <div className="flex items-end gap-4">
        <div>
          <div className="flex items-baseline gap-1">
            <span
              className="tabular-nums text-[var(--ink-primary)] leading-none"
              style={{ fontFamily: "var(--font-display)", fontSize: "36px" }}
            >
              {current}
            </span>
            <span className="t-small text-[var(--ink-tertiary)]">
              day{current !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="t-label text-[var(--ink-tertiary)]">current streak</p>
        </div>

        <div className="h-10 w-px bg-[var(--surface-2)]" />

        <div>
          <span className="text-lg font-medium text-[var(--ink-secondary)] tabular-nums">{longest}</span>
          <p className="t-label text-[var(--ink-tertiary)]">best</p>
        </div>

        <div>
          <span className="text-lg font-medium text-[var(--ink-secondary)] tabular-nums">{totalVotes}</span>
          <p className="t-label text-[var(--ink-tertiary)]">votes</p>
        </div>
      </div>

      {/* Milestone banner */}
      {atMilestone && (
        <div className="card-accent px-3 py-2.5 animate-scale-in">
          <p className="t-small font-medium text-[var(--accent)]">
            🎯 {current}-day milestone{current === 66 ? " — this is who you are now." : " reached."}
          </p>
        </div>
      )}

      {/* Milestone progress */}
      {nextMilestone && !atMilestone && (
        <div>
          <div className="flex justify-between t-label text-[var(--ink-tertiary)] mb-2">
            <span>{lastMilestone ? `${lastMilestone}d` : "Start"}</span>
            <span>{nextMilestone}d</span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill progress-fill-accent"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="t-small text-[var(--ink-tertiary)] mt-1.5">
            {nextMilestone - current} day{nextMilestone - current !== 1 ? "s" : ""} to milestone
          </p>
        </div>
      )}
    </div>
  )
}
