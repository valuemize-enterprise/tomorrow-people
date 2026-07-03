"use client"

import { useState, useEffect } from "react"
import type { ReinforcementMessage } from "@/hooks/use-intelligence"

export function ReinforcementToast({ message }: { message: ReinforcementMessage }) {
  const [visible,   setVisible]   = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 150)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (message.isPersistent) return
    const t = setTimeout(() => setDismissed(true), 7000)
    return () => clearTimeout(t)
  }, [message.isPersistent])

  if (dismissed) return null

  return (
    <div
      className={`
        card-accent p-4 transition-all duration-500
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}
      `}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none shrink-0 mt-0.5" aria-hidden>
          {message.emoji}
        </span>
        <div className="flex-1 min-w-0">
          <p
            className="font-display text-[var(--ink-primary)] leading-snug mb-0.5"
            style={{ fontFamily: "var(--font-display)", fontSize: "16px" }}
          >
            {message.headline}
          </p>
          <p className="t-small text-[var(--ink-secondary)] leading-relaxed">
            {message.body}
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="btn-ghost w-7 h-7 flex items-center justify-center p-0 shrink-0"
          aria-label="Dismiss"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
