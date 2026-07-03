"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function OnboardingPage() {
  const [anchor, setAnchor] = useState("")
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!anchor.trim()) return
    setSaving(true)
    await fetch("/api/users/me", {
      method: "PATCH",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ onboardingAnchor: anchor, onboardingComplete: true })
    })
    router.push("/today")
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4" style={{background:"var(--s0)"}}>
      <div style={{maxWidth:"480px",width:"100%"}}>
        <p style={{fontSize:"11px",fontWeight:"500",letterSpacing:".06em",textTransform:"uppercase",color:"var(--ink3)",marginBottom:"12px"}}>Welcome</p>
        <h1 style={{fontFamily:"var(--font-display)",fontSize:"32px",color:"var(--ink)",marginBottom:"16px",lineHeight:"1.1"}}>One question to start.</h1>
        <p style={{fontSize:"16px",color:"var(--ink2)",marginBottom:"32px",lineHeight:"1.7",fontWeight:"300"}}>What do you already do every morning without thinking? Making coffee, brushing your teeth, checking your phone — this becomes the anchor for every habit you build.</p>
        <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:"12px"}}>
          <input
            type="text"
            value={anchor}
            onChange={e => setAnchor(e.target.value)}
            placeholder="e.g. Make coffee, brush teeth, open laptop…"
            className="input"
            autoFocus
          />
          <button type="submit" disabled={!anchor.trim() || saving} className="btn btn-primary btn-full">
            {saving ? "Setting up…" : "Build my first habit stack →"}
          </button>
        </form>
      </div>
    </div>
  )
}
