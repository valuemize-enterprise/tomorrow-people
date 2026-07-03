"use client"

import {
  useState,
  useRef,
  useEffect,
  type KeyboardEvent,
  type FormEvent,
} from "react"
import { useAICoach, useInsights, type ChatMessage } from "@/hooks/use-ai-coach"

// ─── Quick prompt suggestions ─────────────────────────────────────

const QUICK_PROMPTS = [
  "Why do I keep skipping exercise?",
  "What does my data say about last week?",
  "I missed 2 days — what now?",
  "Suggest a new habit for my stack",
]

// ─── Main panel (chat + insights sidebar) ─────────────────────────

export function AiCoachPanel() {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 300px" }}>
      <ChatPanel />
      <InsightsSidebar />
    </div>
  )
}

// ─── Chat panel ───────────────────────────────────────────────────

function ChatPanel() {
  const { messages, streaming, error, sendMessage } = useAICoach()
  const [draft,    setDraft]    = useState("")
  const bottomRef               = useRef<HTMLDivElement>(null)
  const textareaRef             = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleSend() {
    if (!draft.trim() || streaming) return
    const text = draft
    setDraft("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
    await sendMessage(text)
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setDraft(e.target.value)
    // Auto-grow
    e.target.style.height = "auto"
    e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`
  }

  return (
    <div
      className="card flex flex-col"
      style={{ height: "560px", borderRadius: "var(--r-xl)" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 shrink-0"
        style={{
          padding:      "16px 20px",
          borderBottom: "0.5px solid var(--s3)",
        }}
      >
        <CoachAvatar />
        <div>
          <p style={{ fontSize: "14px", fontWeight: "500", color: "var(--ink)" }}>
            Your discipline coach
          </p>
          <p style={{ fontSize: "11px", color: "var(--success)", display: "flex", alignItems: "center", gap: "4px" }}>
            <LiveDot /> Online · knows your stack
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto flex flex-col gap-3"
        style={{ padding: "16px", scrollbarWidth: "thin" }}
      >
        {/* Welcome message */}
        {messages.length === 0 && (
          <ChatBubble
            message={{
              id:        "welcome",
              role:      "assistant",
              content:   "Good morning. Your habit chain is intact. What do you want to work through today?",
              timestamp: new Date(),
            }}
          />
        )}

        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}

        {/* Error */}
        {error && (
          <p style={{ fontSize: "12px", color: "var(--danger)", textAlign: "center" }}>
            {error}
          </p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div
        className="flex flex-wrap gap-1.5 shrink-0"
        style={{
          padding:    "10px 14px",
          borderTop:  "0.5px solid var(--s3)",
        }}
      >
        {QUICK_PROMPTS.map((q) => (
          <button
            key={q}
            onClick={() => !streaming && sendMessage(q)}
            disabled={streaming}
            style={{
              background:   "var(--s2)",
              border:       "0.5px solid var(--s3)",
              color:        "var(--ink2)",
              padding:      "5px 10px",
              borderRadius: "var(--r-pill)",
              fontSize:     "11px",
              cursor:       streaming ? "not-allowed" : "pointer",
              opacity:      streaming ? 0.5 : 1,
              transition:   "all 0.15s",
              whiteSpace:   "nowrap",
              fontFamily:   "var(--font-body)",
            }}
            onMouseEnter={(e) => {
              if (!streaming) {
                e.currentTarget.style.background = "var(--ink)"
                e.currentTarget.style.color      = "var(--iv)"
                e.currentTarget.style.borderColor = "var(--ink)"
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--s2)"
              e.currentTarget.style.color      = "var(--ink2)"
              e.currentTarget.style.borderColor = "var(--s3)"
            }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div
        className="flex items-end gap-2 shrink-0"
        style={{
          padding:   "10px 14px 14px",
          borderTop: "0.5px solid var(--s3)",
        }}
      >
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={handleTextareaChange}
          onKeyDown={handleKey}
          placeholder="Ask your coach anything…"
          rows={1}
          style={{
            flex:         "1",
            background:   "var(--s2)",
            border:       "1.5px solid transparent",
            borderRadius: "var(--r-md)",
            padding:      "10px 13px",
            fontFamily:   "var(--font-body)",
            fontSize:     "13px",
            color:        "var(--ink)",
            resize:       "none",
            outline:      "none",
            maxHeight:    "100px",
            lineHeight:   "1.5",
            transition:   "border-color 0.15s, background 0.15s, box-shadow 0.15s",
          }}
          onFocus={(e) => {
            e.currentTarget.style.background   = "var(--s1)"
            e.currentTarget.style.borderColor  = "var(--a)"
            e.currentTarget.style.boxShadow    = "0 0 0 3px rgba(201,122,58,.12)"
          }}
          onBlur={(e) => {
            e.currentTarget.style.background  = "var(--s2)"
            e.currentTarget.style.borderColor = "transparent"
            e.currentTarget.style.boxShadow   = "none"
          }}
        />
        <button
          onClick={handleSend}
          disabled={!draft.trim() || streaming}
          aria-label="Send message"
          style={{
            width:        "38px",
            height:       "38px",
            borderRadius: "var(--r-md)",
            background:   "var(--ink)",
            color:        "var(--iv)",
            border:       "none",
            cursor:       !draft.trim() || streaming ? "not-allowed" : "pointer",
            opacity:      !draft.trim() || streaming ? 0.38 : 1,
            display:      "flex",
            alignItems:   "center",
            justifyContent: "center",
            flexShrink:   0,
            transition:   "filter 0.15s, transform 0.1s",
          }}
          onMouseEnter={(e) => {
            if (!streaming && draft.trim()) e.currentTarget.style.filter = "brightness(1.12)"
          }}
          onMouseLeave={(e) => { e.currentTarget.style.filter = "" }}
          onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.95)" }}
          onMouseUp={(e) => { e.currentTarget.style.transform = "" }}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  )
}

// ─── Chat bubble ──────────────────────────────────────────────────

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user"

  return (
    <div
      className="flex items-end gap-2 animate-fade-up"
      style={{ flexDirection: isUser ? "row-reverse" : "row" }}
    >
      {/* Avatar */}
      <div
        style={{
          width:          "28px",
          height:         "28px",
          borderRadius:   "50%",
          background:     isUser ? "var(--s3)" : "var(--ink)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          fontSize:       isUser ? "11px" : "14px",
          color:          isUser ? "var(--ink2)" : "var(--iv)",
          flexShrink:     0,
          fontWeight:     isUser ? "500" : "400",
        }}
        aria-hidden
      >
        {isUser ? "You" : "🧠"}
      </div>

      {/* Bubble */}
      <div style={{ maxWidth: "76%" }}>
        <div
          style={{
            padding:      "11px 14px",
            borderRadius: isUser ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
            background:   isUser ? "var(--ink)" : "var(--s2)",
            color:        isUser ? "var(--iv)" : "var(--ink)",
            fontSize:     "13.5px",
            lineHeight:   "1.65",
            fontFamily:   "var(--font-body)",
          }}
        >
          {message.content}
          {/* Blinking cursor while streaming */}
          {message.streaming && (
            <span
              style={{
                display:       "inline-block",
                width:         "2px",
                height:        "0.9em",
                background:    "var(--ink3)",
                verticalAlign: "text-bottom",
                marginLeft:    "2px",
                animation:     "cursorBlink .8s step-end infinite",
              }}
              aria-hidden
            />
          )}
        </div>
        <p
          style={{
            fontSize:  "10px",
            color:     "var(--ink3)",
            marginTop: "4px",
            padding:   "0 2px",
            textAlign: isUser ? "right" : "left",
          }}
        >
          {message.timestamp.toLocaleTimeString("en-GB", {
            hour:   "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      <style>{`
        @keyframes cursorBlink {
          0%,100%{opacity:1} 50%{opacity:0}
        }
      `}</style>
    </div>
  )
}

// ─── Insights sidebar ─────────────────────────────────────────────

function InsightsSidebar() {
  const { data, loading } = useInsights()

  if (loading) return <SidebarSkeleton />

  return (
    <div className="flex flex-col gap-3">
      {/* Daily message */}
      {data?.dailyMessage && (
        <SideCard>
          <p className="type-label mb-2">Your coach says</p>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontStyle:  "italic",
              fontSize:   "14px",
              color:      "var(--ink)",
              lineHeight: "1.6",
            }}
          >
            {data.dailyMessage}
          </p>
        </SideCard>
      )}

      {/* Summary stats */}
      {data?.summary && (
        <SideCard>
          <p className="type-label mb-3">Your context</p>
          <StatRow label="Today" value={`${data.summary.todayCompleted}/${data.summary.todayTotal} done`} />
          <StatRow label="Score" value={`${data.summary.todayScore} pts`} />
          <StatRow label="Missed days" value={data.summary.consecutiveMissDays === 0 ? "None ✓" : `${data.summary.consecutiveMissDays} day${data.summary.consecutiveMissDays !== 1 ? "s" : ""}`} />
          <StatRow label="Best streak" value={`${data.summary.longestCurrentStreak} days`} />
          {/* Today progress bar */}
          <div style={{ marginTop: "10px" }}>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${data.summary.todayTotal > 0 ? (data.summary.todayCompleted / data.summary.todayTotal) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </SideCard>
      )}

      {/* Milestones */}
      {(data?.milestones?.length ?? 0) > 0 && (
        <SideCard style={{ background: "var(--al)", border: "1px solid var(--ab)" }}>
          <p className="type-label mb-2" style={{ color: "var(--accent-d)" }}>Milestone today</p>
          {data!.milestones.map((m) => (
            <p
              key={m.habitName}
              style={{ fontSize: "13px", color: "var(--a)", fontWeight: "500" }}
            >
              🔥 {m.habitName} — {m.days} days
            </p>
          ))}
        </SideCard>
      )}

      {/* Weekly analysis */}
      {data?.weeklyAnalysis && (
        <SideCard style={{ background: "var(--ink)", border: "0.5px solid var(--ink)" }}>
          <p className="type-label mb-2" style={{ color: "rgba(255,255,255,.3)" }}>Weekly insight</p>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontStyle:  "italic",
              fontSize:   "13px",
              color:      "rgba(255,255,255,.78)",
              lineHeight: "1.65",
            }}
          >
            {data.weeklyAnalysis}
          </p>
        </SideCard>
      )}

      {/* At-risk habits */}
      {(data?.atRisk?.length ?? 0) > 0 && (
        <SideCard>
          <p className="type-label mb-2" style={{ color: "var(--warning)" }}>Needs attention</p>
          {data!.atRisk.map((h) => (
            <div key={h.name} style={{ marginBottom: "8px" }}>
              <p style={{ fontSize: "12px", fontWeight: "500", color: "var(--ink)" }}>{h.name}</p>
              <p style={{ fontSize: "11px", color: "var(--ink3)" }}>
                {Math.round(h.completionRate7d * 100)}% last 7d · friction {h.frictionScore}
              </p>
            </div>
          ))}
        </SideCard>
      )}
    </div>
  )
}

// ─── Micro-components ─────────────────────────────────────────────

function SideCard({
  children,
  style = {},
}: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div
      style={{
        background:   "var(--white)",
        border:       "0.5px solid var(--s3)",
        borderRadius: "var(--r-lg)",
        padding:      "16px",
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display:       "flex",
        justifyContent: "space-between",
        alignItems:    "baseline",
        padding:       "5px 0",
        borderBottom:  "0.5px solid var(--s3)",
      }}
    >
      <span style={{ fontSize: "12px", color: "var(--ink2)" }}>{label}</span>
      <span style={{ fontSize: "13px", fontWeight: "500", color: "var(--ink)" }}>{value}</span>
    </div>
  )
}

function SidebarSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[80, 140, 60, 100].map((h, i) => (
        <div key={i} className="skeleton" style={{ height: `${h}px`, borderRadius: "var(--r-lg)" }} />
      ))}
    </div>
  )
}

function CoachAvatar() {
  return (
    <div
      style={{
        width:          "38px",
        height:         "38px",
        borderRadius:   "50%",
        background:     "var(--ink)",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        fontSize:       "18px",
        flexShrink:     0,
      }}
      aria-hidden
    >
      🧠
    </div>
  )
}

function LiveDot() {
  return (
    <span
      style={{
        width:        "5px",
        height:       "5px",
        borderRadius: "50%",
        background:   "var(--success)",
        display:      "inline-block",
        animation:    "pulse 2.2s ease-in-out infinite",
      }}
      aria-hidden
    />
  )
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  )
}
