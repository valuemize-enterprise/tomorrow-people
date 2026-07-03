"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useJournal } from "@/hooks/use-intelligence"

const MOODS = [
  { key: "great",   emoji: "🌟", label: "Great"   },
  { key: "good",    emoji: "😊", label: "Good"    },
  { key: "neutral", emoji: "😐", label: "Neutral" },
  { key: "hard",    emoji: "😓", label: "Hard"    },
  { key: "rough",   emoji: "🌧️", label: "Rough"   },
] as const

type MoodKey = (typeof MOODS)[number]["key"]

export function JournalEntryWidget() {
  const { entry, prompt, loading, saving, saved, save } = useJournal()

  const [body,     setBody]     = useState("")
  const [mood,     setMood]     = useState<MoodKey | undefined>(undefined)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (entry?.body) { setBody(entry.body); setExpanded(true) }
    if (entry?.mood) setMood(entry.mood as MoodKey)
  }, [entry])

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleChange = useCallback(
    (val: string) => {
      setBody(val)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        if (val.trim()) save(val, mood)
      }, 1500)
    },
    [mood, save],
  )

  function handleMoodSelect(key: MoodKey) {
    setMood(key)
    if (body.trim()) save(body, key)
  }

  const wordCount = body.split(/\s+/).filter(Boolean).length

  if (loading) {
    return <div className="skeleton" style={{ height: 64 }} />
  }

  return (
    <div
      className="overflow-hidden transition-all duration-300"
      style={{
        background: "var(--s1)",
        border: `0.5px solid ${expanded ? "var(--ab)" : "var(--s3)"}`,
        borderRadius: "var(--r-xl)",
        boxShadow: expanded ? "var(--sh-sm)" : "none",
      }}
    >
      {/* ── Header toggle ────────────────────────────────────────── */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start justify-between gap-3 text-left transition-colors duration-150"
        style={{
          padding: "16px 20px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--s2)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <div className="flex-1 min-w-0">
          <p className="type-label mb-1.5">Reflect</p>
          <p
            className="leading-snug line-clamp-2"
            style={{
              fontFamily: "var(--font-display)",
              fontSize:   "15px",
              color:      "var(--i1)",
              fontStyle:  "italic",
            }}
          >
            {prompt?.text ?? "What's on your mind?"}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 mt-0.5">
          {saved && (
            <span className="badge badge-accent animate-fade-in">+10 pts</span>
          )}
          {!expanded && entry?.body && (
            <span className="badge badge-success">Saved</span>
          )}
          <svg
            width="16" height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--i3)"
            strokeWidth="2"
            strokeLinecap="round"
            className="transition-transform duration-200 shrink-0"
            style={{ transform: expanded ? "rotate(180deg)" : "" }}
            aria-hidden
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </button>

      {/* ── Expandable body ──────────────────────────────────────── */}
      {expanded && (
        <div
          className="animate-fade-in"
          style={{ borderTop: "0.5px solid var(--s3)", padding: "16px 20px 20px" }}
        >
          {/* Mood picker */}
          <div className="flex gap-2 mb-4">
            {MOODS.map((m) => (
              <button
                key={m.key}
                onClick={() => handleMoodSelect(m.key)}
                aria-label={m.label}
                title={m.label}
                className="flex-1 transition-all duration-150"
                style={{
                  height: "38px",
                  borderRadius: "var(--r-sm)",
                  fontSize: "16px",
                  border: "none",
                  cursor: "pointer",
                  background: mood === m.key ? "var(--i1)" : "var(--s2)",
                  transform: mood === m.key ? "scale(1.06)" : "scale(1)",
                  boxShadow: mood === m.key ? "var(--sh-xs)" : "none",
                }}
                onMouseEnter={(e) => {
                  if (mood !== m.key) e.currentTarget.style.background = "var(--s3)"
                }}
                onMouseLeave={(e) => {
                  if (mood !== m.key) e.currentTarget.style.background = "var(--s2)"
                }}
              >
                {m.emoji}
              </button>
            ))}
          </div>

          {/* Textarea */}
          <textarea
            value={body}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Two sentences is enough. No pressure."
            rows={4}
            className="input"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              lineHeight: "1.7",
              resize: "none",
              background: "var(--s2)",
            }}
          />

          {/* Footer */}
          <div
            className="flex items-center justify-between mt-2"
            style={{ minHeight: "20px" }}
          >
            <span className="type-small">
              {wordCount > 0
                ? `${wordCount} word${wordCount !== 1 ? "s" : ""}`
                : "Autosaves as you write"}
            </span>
            <span
              className="type-small transition-opacity duration-300"
              style={{ opacity: saving ? 1 : 0 }}
            >
              Saving…
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
