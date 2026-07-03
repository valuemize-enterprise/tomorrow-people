/**
 * app/(dashboard)/coach/page.tsx
 *
 * The dedicated AI coach page.
 * Accessible from the bottom nav — add a CoachIcon to dashboard/layout.tsx.
 *
 * Layout:
 *   - Mobile:  full-width chat (sidebar hidden)
 *   - Tablet+: chat (left) + insights sidebar (right)
 */

import { AiCoachPanel } from "@/components/coaching/ai-coach-panel"

export const metadata = {
  title: "Your Coach — Tomorrow's People",
}

export default function CoachPage() {
  return (
    <div className="min-h-dvh" style={{ background: "var(--s0)" }}>
      <div
        className="max-w-5xl mx-auto pb-nav"
        style={{ padding: "32px max(16px, 4vw)" }}
      >
        {/* Header */}
        <header style={{ marginBottom: "24px" }}>
          <p className="type-label mb-1">AI Coach</p>
          <h1
            style={{
              fontFamily:   "var(--font-display)",
              fontSize:     "clamp(24px,4vw,36px)",
              fontWeight:   "400",
              lineHeight:   "1.1",
              letterSpacing: "-.02em",
              color:        "var(--ink)",
            }}
          >
            Knows your data.<br />
            <span style={{ fontStyle: "italic", color: "var(--ink2)" }}>Speaks plainly.</span>
          </h1>
        </header>

        {/* Coach panel — chat + insights */}
        <AiCoachPanel />
      </div>
    </div>
  )
}
