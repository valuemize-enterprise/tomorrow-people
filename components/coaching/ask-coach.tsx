"use client"

import { useState } from "react"
import { useHabitRecommendation } from "@/hooks/use-coaching"
import { CoachingCard } from "@/components/coaching/coaching-card"

/**
 * AskCoach
 * A text input that lets the user describe a goal and receive a
 * personalised habit recommendation from the AI coach.
 *
 * Placed on the /habits page below the current stack.
 */
export function AskCoach() {
  const [goal,     setGoal]     = useState("")
  const [expanded, setExpanded] = useState(false)

  const { message, submitting, error, recommend } = useHabitRecommendation()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!goal.trim() || submitting) return
    await recommend(goal)
  }

  return (
    <div
      className="overflow-hidden transition-all duration-300"
      style={{
        background:   "var(--s1)",
        border:       "0.5px solid var(--s3)",
        borderRadius: "var(--r-xl)",
      }}
    >
      {/* Toggle header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left"
        style={{
          padding:     "16px 20px",
          background:  "transparent",
          border:      "none",
          cursor:      "pointer",
          display:     "flex",
          alignItems:  "center",
          justifyContent: "space-between",
          gap:         "12px",
          transition:  "background .15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--s2)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <div>
          <p className="type-label mb-0.5">Ask your coach</p>
          <p style={{ fontSize: "14px", color: "var(--ink2)" }}>
            Want help adding a new habit to your stack?
          </p>
        </div>
        <svg
          width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="var(--ink3)" strokeWidth="2" strokeLinecap="round"
          style={{ transform: expanded ? "rotate(180deg)" : "", transition: "transform .2s", flexShrink: 0 }}
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Form */}
      {expanded && (
        <div
          className="animate-fade-in"
          style={{ borderTop: "0.5px solid var(--s3)", padding: "18px 20px 20px" }}
        >
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <label>
              <p style={{ fontSize: "12px", color: "var(--ink3)", marginBottom: "8px" }}>
                What do you want to achieve? Be specific.
              </p>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. I want to read more, build a writing practice, meditate daily, get stronger…"
                rows={3}
                className="input"
                style={{ fontFamily: "var(--font-body)", fontSize: "14px", lineHeight: "1.65", resize: "none" }}
              />
            </label>

            <button
              type="submit"
              disabled={!goal.trim() || submitting}
              className="btn btn-primary"
              style={{ alignSelf: "flex-start", padding: "10px 20px" }}
            >
              {submitting ? (
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Spinner /> Getting recommendation…
                </span>
              ) : (
                "Get habit recommendation →"
              )}
            </button>
          </form>

          {/* Error */}
          {error && (
            <p style={{ fontSize: "12px", color: "var(--danger)", marginTop: "10px" }}>
              {error}
            </p>
          )}

          {/* Recommendation */}
          {message && (
            <div style={{ marginTop: "16px" }}>
              <CoachingCard message={message} type="RECOMMENDATION" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}
