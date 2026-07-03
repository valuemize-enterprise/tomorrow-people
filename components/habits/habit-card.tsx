"use client"

/**
 * components/habits/habit-card.tsx
 * UX FIXES:
 *   1. "2 mins" button renamed to "2-min minimum" + tooltip explaining what it does
 *   2. First-use hint shown below the buttons (dismisses on first tap)
 *   3. Completion state shows which button was used ("Full ✓" vs "Minimum ✓")
 *   4. Skip option has clearer label + consequence note
 */

import { useState, useCallback } from "react"
import type { Habit, TodayLog, Streak } from "@/hooks/use-habits"

type Props = {
  habit:           Habit
  log:             TodayLog | undefined
  onLog:           (habitId: string, status: "DONE" | "PARTIAL" | "SKIPPED") => Promise<{ log: TodayLog; streak: Streak } | null>
  index?:          number
  showFirstUseHint?: boolean   // true for the first uncompleted card in the list
}

export function HabitCard({ habit, log, onLog, index = 0, showFirstUseHint = false }: Props) {
  const [localStreak, setLocalStreak] = useState<Streak | null>(habit.streak ?? null)
  const [voteAnim,    setVoteAnim]    = useState(false)
  const [showSkip,    setShowSkip]    = useState(false)
  const [showHint,    setShowHint]    = useState(showFirstUseHint)
  const [loading,     setLoading]     = useState<"DONE" | "PARTIAL" | null>(null)

  const isDone      = log?.status === "DONE"
  const isPartial   = log?.status === "PARTIAL"
  const isCompleted = isDone || isPartial

  const handleLog = useCallback(
    async (status: "DONE" | "PARTIAL" | "SKIPPED") => {
      if (loading || isCompleted) return
      setLoading(status === "SKIPPED" ? null : status)
      setShowHint(false)

      const result = await onLog(habit.id, status)
      if (result?.streak) {
        setLocalStreak(result.streak)
        if (status !== "SKIPPED") {
          setVoteAnim(true)
          setTimeout(() => setVoteAnim(false), 800)
        }
      }
      setLoading(null)
      setShowSkip(false)
    },
    [loading, isCompleted, habit.id, onLog],
  )

  return (
    <article
      className={`animate-fade-up delay-${Math.min(index + 1, 5)} relative overflow-hidden transition-all duration-300 ${
        isCompleted ? "opacity-60" : "card card-interactive"
      }`}
      style={{
        borderRadius: "var(--r-xl)",
        border:       `0.5px solid ${isCompleted ? "var(--s3)" : "var(--s3)"}`,
        background:   "var(--s1)",
        boxShadow:    isCompleted ? "none" : "var(--sh-sm)",
      }}
    >
      {/* Completion bar */}
      <div
        style={{
          height:          "3px",
          background:      isDone ? "var(--success)" : isPartial ? "var(--a)" : "transparent",
          transform:       isCompleted ? "scaleX(1)" : "scaleX(0)",
          transformOrigin: "left",
          transition:      "all 0.5s",
        }}
      />

      <div style={{ padding: "16px 20px 18px" }}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <p className="type-label mb-1 truncate">After {habit.anchorHabit}</p>
            <h3
              style={{
                fontFamily:     "var(--font-display)",
                fontSize:       "17px",
                lineHeight:     "1.2",
                letterSpacing:  "-.01em",
                color:          isCompleted ? "var(--ink3)" : "var(--ink)",
                textDecoration: isCompleted ? "line-through" : "none",
                textDecorationColor: "var(--ink3)",
              }}
            >
              {habit.name}
            </h3>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <div
              className={`flex items-center gap-1 ${voteAnim ? "animate-spring" : ""}`}
            >
              <span aria-hidden>🔥</span>
              <span
                style={{
                  fontSize:   "15px",
                  fontWeight: "600",
                  color:      voteAnim ? "var(--a)" : "var(--ink2)",
                  tabularNums: "true",
                }}
              >
                {localStreak?.current ?? 0}
              </span>
            </div>
            <span className="type-small">{localStreak?.totalVotes ?? 0} votes</span>
          </div>
        </div>

        {/* Min version */}
        {!isCompleted && (
          <p className="type-small italic mb-4">Minimum: {habit.minVersion}</p>
        )}

        {/* Completion label */}
        {isCompleted && (
          <p style={{ fontSize: "12px", fontWeight: "500", color: isDone ? "var(--success)" : "var(--a)", marginBottom: "4px" }}>
            {isDone ? "Full version done ✓" : "2-minute minimum done ✓ — streak lives"}
            {voteAnim && <span className="animate-fade-in ml-2">· Vote #{localStreak?.totalVotes}</span>}
          </p>
        )}

        {/* Buttons */}
        {!isCompleted && (
          <>
            <div className="flex gap-2">
              <button
                onClick={() => handleLog("DONE")}
                disabled={!!loading}
                className="btn btn-primary flex-1"
                style={{ padding: "10px 0", borderRadius: "var(--r-md)", fontSize: "13px" }}
              >
                {loading === "DONE" ? <Spinner light /> : <>✓ Done</>}
              </button>

              {/* FIX: Renamed + tooltip */}
              <div className="relative flex-1 group">
                <button
                  onClick={() => handleLog("PARTIAL")}
                  disabled={!!loading}
                  className="btn btn-secondary w-full"
                  style={{ padding: "10px 0", borderRadius: "var(--r-md)", fontSize: "13px" }}
                  aria-label={`${habit.minVersion} — counts as done, streak preserved`}
                >
                  {loading === "PARTIAL" ? <Spinner /> : "2-min minimum"}
                </button>
                {/* Tooltip */}
                <div
                  className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-10"
                  style={{
                    background:   "var(--ink)",
                    color:        "var(--iv)",
                    borderRadius: "var(--r-sm)",
                    padding:      "6px 10px",
                    fontSize:     "11px",
                    lineHeight:   "1.4",
                    whiteSpace:   "nowrap",
                  }}
                >
                  "{habit.minVersion}"
                  <br />
                  <span style={{ opacity: 0.6 }}>Counts as done · streak preserved</span>
                </div>
              </div>

              {/* Skip (buried) */}
              <div className="relative">
                <button
                  onClick={() => setShowSkip((v) => !v)}
                  className="btn btn-secondary"
                  style={{ padding: "10px 12px", borderRadius: "var(--r-md)", color: "var(--ink3)" }}
                  aria-label="More options"
                  aria-expanded={showSkip}
                >
                  ···
                </button>
                {showSkip && (
                  <div
                    className="absolute right-0 bottom-full mb-2 animate-scale-in z-10"
                    style={{
                      background:   "var(--s1)",
                      border:       "0.5px solid var(--s3)",
                      borderRadius: "var(--r-md)",
                      boxShadow:    "var(--sh-md)",
                      minWidth:     "180px",
                      overflow:     "hidden",
                    }}
                  >
                    <button
                      onClick={() => handleLog("SKIPPED")}
                      style={{
                        display:    "block",
                        width:      "100%",
                        textAlign:  "left",
                        padding:    "10px 14px",
                        fontSize:   "12px",
                        color:      "var(--ink2)",
                        background: "transparent",
                        border:     "none",
                        cursor:     "pointer",
                      }}
                    >
                      Skip today
                      <span
                        style={{ display: "block", fontSize: "10px", color: "var(--ink3)", marginTop: "2px" }}
                      >
                        Streak will break after 2 skips
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* First-use hint (dismisses on first tap) */}
            {showHint && (
              <p
                className="animate-fade-in type-small"
                style={{ marginTop: "8px", color: "var(--a)", textAlign: "center" }}
              >
                "2-min minimum" counts as done and keeps your streak alive on hard days.
              </p>
            )}
          </>
        )}
      </div>
    </article>
  )
}

function Spinner({ light = false }: { light?: boolean }) {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}
