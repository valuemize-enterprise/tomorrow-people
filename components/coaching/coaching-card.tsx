"use client"

import { useState, useEffect } from "react"
import type { CoachingMessageType } from "@/hooks/use-coaching"

// ─── Coaching card — displays a single coaching message ───────────

type Props = {
  message:    string
  type:       CoachingMessageType
  streaming?: boolean   // true while reflection is streaming in
  className?: string
}

const TYPE_CONFIG: Record<CoachingMessageType, {
  emoji:    string
  label:    string
  bgVar:    string
  borderVar: string
  labelColor: string
}> = {
  MORNING:       { emoji: "🌅", label: "Your coach",    bgVar: "--s2",        borderVar: "--s3",    labelColor: "--ink3" },
  RECOVERY:      { emoji: "↩️", label: "Recovery",      bgVar: "--s2",        borderVar: "--s3",    labelColor: "--ink2" },
  MILESTONE_7:   { emoji: "🔥", label: "7 days",        bgVar: "--accent-l",  borderVar: "--accent-b", labelColor: "--accent-d" },
  MILESTONE_21:  { emoji: "🧠", label: "21 days",       bgVar: "--accent-l",  borderVar: "--accent-b", labelColor: "--accent-d" },
  MILESTONE_66:  { emoji: "🪞", label: "66 days",       bgVar: "--ink",       borderVar: "--ink",   labelColor: "--iv"     },
  REFLECTION:    { emoji: "✍️", label: "Your coach",    bgVar: "--s2",        borderVar: "--s3",    labelColor: "--ink3"   },
  ANALYSIS:      { emoji: "📊", label: "Weekly insight", bgVar: "--s2",       borderVar: "--s3",    labelColor: "--ink3"   },
  RECOMMENDATION:{ emoji: "🔗", label: "New habit",     bgVar: "--success-l", borderVar: "--success-b", labelColor: "--success" },
}

export function CoachingCard({ message, type, streaming = false, className = "" }: Props) {
  const cfg      = TYPE_CONFIG[type]
  const isDark   = type === "MILESTONE_66"

  // Typewriter effect for non-streamed messages
  const [displayed, setDisplayed] = useState(streaming ? message : "")
  const [done,      setDone]      = useState(streaming)

  useEffect(() => {
    if (streaming) {
      // Streaming — message updates externally, display as-is
      setDisplayed(message)
      return
    }

    // Typewriter for static messages
    let i = 0
    setDisplayed("")
    setDone(false)

    const delay = message.length > 120 ? 12 : 18
    const timer = setInterval(() => {
      setDisplayed(message.slice(0, i + 1))
      i++
      if (i >= message.length) {
        clearInterval(timer)
        setDone(true)
      }
    }, delay)

    return () => clearInterval(timer)
  }, [message, streaming])

  return (
    <div
      className={`overflow-hidden transition-all duration-300 ${className}`}
      style={{
        background:   `var(${cfg.bgVar})`,
        border:       `0.5px solid var(${cfg.borderVar})`,
        borderRadius: "var(--r-xl)",
        boxShadow:    "var(--sh-xs)",
      }}
    >
      <div style={{ padding: "18px 20px" }}>
        {/* Header */}
        <div
          className="flex items-center gap-2 mb-3"
          style={{ borderBottom: isDark ? "0.5px solid rgba(255,255,255,.08)" : "0.5px solid var(--s3)", paddingBottom: "12px" }}
        >
          <span style={{ fontSize: "16px" }} aria-hidden>{cfg.emoji}</span>
          <span
            style={{
              fontSize:      "11px",
              fontWeight:    "500",
              letterSpacing: ".06em",
              textTransform: "uppercase",
              color:         `var(${cfg.labelColor})`,
            }}
          >
            {cfg.label}
          </span>

          {/* Streaming indicator */}
          {streaming && !done && (
            <div className="ml-auto flex gap-1" aria-label="Coach is responding">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: "4px", height: "4px",
                    borderRadius: "50%",
                    background: `var(${cfg.labelColor})`,
                    animation: `dotBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Message body — display font for emotional weight */}
        <p
          style={{
            fontFamily:  "var(--font-display)",
            fontStyle:   "italic",
            fontSize:    "16px",
            lineHeight:  "1.62",
            color:       isDark ? "rgba(255,255,255,.88)" : "var(--ink)",
            minHeight:   "48px",
          }}
        >
          {displayed}
          {/* Blinking cursor while typing */}
          {!done && (
            <span
              style={{
                display:         "inline-block",
                width:           "2px",
                height:          "1em",
                background:      isDark ? "rgba(255,255,255,.4)" : "var(--ink3)",
                verticalAlign:   "text-bottom",
                marginLeft:      "2px",
                animation:       "cursorBlink .85s step-end infinite",
              }}
              aria-hidden
            />
          )}
        </p>
      </div>

      <style>{`
        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0); opacity: .3; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}

// ─── Coaching Card Skeleton (loading state) ───────────────────────

export function CoachingCardSkeleton() {
  return (
    <div
      className="skeleton"
      style={{ height: "110px", borderRadius: "var(--r-xl)" }}
      aria-busy="true"
      aria-label="Loading coaching message"
    />
  )
}
