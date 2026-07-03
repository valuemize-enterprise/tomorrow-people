"use client"

import { useRouter } from "next/navigation"
import type { RecoveryState } from "@/hooks/use-intelligence"

const TIER_CONFIG = {
  TIER_1: {
    bg:     "bg-[var(--surface-2)]",
    border: "border-[var(--surface-3)]",
    pill:   "badge badge-neutral",
    btn:    "btn-primary",
    pillLabel: "Missed yesterday",
  },
  TIER_2: {
    bg:     "bg-[var(--warning-light)]",
    border: "border-[#fde8a0]",
    pill:   "badge badge-warning",
    btn:    "btn-primary",
    pillLabel: "2 days missed",
  },
  TIER_3: {
    bg:     "bg-[var(--danger-light)]",
    border: "border-[#fccaca]",
    pill:   "badge badge-danger",
    btn:    "btn-primary",
    pillLabel: "days missed",
  },
  NONE: { bg: "", border: "", pill: "", btn: "", pillLabel: "" },
} as const

export function RecoveryCard({ recovery, onAcknowledge }: {
  recovery: RecoveryState
  onAcknowledge: () => void
}) {
  const router = useRouter()
  if (recovery.tier === "NONE") return null

  const cfg = TIER_CONFIG[recovery.tier]
  const pillLabel =
    recovery.tier === "TIER_3"
      ? `${recovery.consecutiveMissDays} ${cfg.pillLabel}`
      : cfg.pillLabel

  function handleCTA() {
    onAcknowledge()
    router.push(recovery.actionRoute)
  }

  return (
    <div className={`rounded-[var(--radius-lg)] border ${cfg.bg} ${cfg.border} p-4 space-y-3 animate-fade-up`}>

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <span className={cfg.pill}>{pillLabel}</span>
        {recovery.tier === "TIER_1" && (
          <button
            onClick={onAcknowledge}
            className="btn-ghost w-6 h-6 p-0 flex items-center justify-center shrink-0"
            aria-label="Dismiss"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Message */}
      <p className="t-body text-[var(--ink-secondary)] leading-relaxed">
        {recovery.message}
      </p>

      {/* Affected habits */}
      {(recovery.tier === "TIER_2" || recovery.tier === "TIER_3") &&
        recovery.affectedHabits.length > 0 && (
        <div className="space-y-1.5">
          {recovery.affectedHabits.map((h) => (
            <div
              key={h.id}
              className="bg-white/50 rounded-[var(--radius-sm)] px-3 py-2 flex items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="t-small font-medium text-[var(--ink-primary)] truncate">
                  {h.name}
                </p>
                <p className="t-small text-[var(--ink-tertiary)] italic mt-0.5">
                  {h.minVersion}
                </p>
              </div>
              {h.frictionScore >= 2 && (
                <span className="badge badge-warning shrink-0">High friction</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <button onClick={handleCTA} className={`${cfg.btn} w-full`}>
        {recovery.action}
      </button>

    </div>
  )
}
