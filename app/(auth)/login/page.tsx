"use client"

import { Suspense, useState } from "react"
import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const [email,   setEmail]   = useState("")
  const [loading, setLoading] = useState<"google" | "email" | null>(null)
  const [sent,    setSent]    = useState(false)

  const searchParams = useSearchParams()
  const error  = searchParams.get("error")
  const verify = searchParams.get("verify")

  async function handleGoogle() {
    setLoading("google")
    await signIn("google", { callbackUrl: "/today" })
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading("email")
    const result = await signIn("email", {
      email,
      redirect: false,
      callbackUrl: "/today",
    })
    setLoading(null)
    if (result?.ok) setSent(true)
  }

  // ── Sent screen ──────────────────────────────────────────────────

  if (sent || verify) {
    return (
      <div className="min-h-dvh bg-[var(--surface-0)] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center animate-fade-up">
          <div className="w-12 h-12 rounded-full bg-[var(--surface-2)] flex items-center justify-center mx-auto mb-5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
          <h1 className="t-title text-[var(--ink-primary)] mb-2">Check your inbox</h1>
          <p className="t-body text-[var(--ink-secondary)] mb-6">
            Magic link sent to{" "}
            <span className="font-medium text-[var(--ink-primary)]">{email || "your email"}</span>.
          </p>
          <button
            onClick={() => setSent(false)}
            className="btn-ghost text-[var(--ink-tertiary)]"
          >
            Use a different email
          </button>
        </div>
      </div>
    )
  }

  // ── Main login ───────────────────────────────────────────────────

  return (
    <div className="min-h-dvh bg-[var(--surface-0)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-up">

        {/* Brand */}
        <div className="text-center mb-10">
          <h1
            className="text-[var(--ink-primary)] mb-2"
            style={{ fontFamily: "var(--font-display)", fontSize: "32px", lineHeight: 1.1 }}
          >
            Tomorrow's People
          </h1>
          <p className="t-body text-[var(--ink-tertiary)]">Start building yourself.</p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-[var(--radius-md)] bg-[var(--danger-light)] border border-[#fccaca] px-4 py-3 t-small text-[var(--danger)] mb-4">
            {error === "OAuthAccountNotLinked"
              ? "An account with this email already exists. Use the same sign-in method."
              : "Sign-in failed. Please try again."}
          </div>
        )}

        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={loading !== null}
          className="btn-secondary w-full mb-4 gap-3"
        >
          {loading === "google" ? <Spinner /> : <GoogleIcon />}
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-[var(--surface-3)]" />
          <span className="t-small text-[var(--ink-tertiary)]">or</span>
          <div className="h-px flex-1 bg-[var(--surface-3)]" />
        </div>

        {/* Magic link */}
        <form onSubmit={handleMagicLink} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            autoComplete="email"
            required
            disabled={!!loading}
            className="input"
          />
          <button
            type="submit"
            disabled={!!loading || !email.trim()}
            className="btn-primary w-full"
          >
            {loading === "email" ? <Spinner light /> : "Send magic link"}
          </button>
        </form>

        {/* Footer */}
        <p className="t-small text-[var(--ink-tertiary)] text-center mt-8">
          By continuing you agree to our{" "}
          <a href="/terms"   className="underline underline-offset-2 hover:text-[var(--ink-secondary)]">Terms</a>
          {" "}and{" "}
          <a href="/privacy" className="underline underline-offset-2 hover:text-[var(--ink-secondary)]">Privacy Policy</a>.
        </p>

      </div>
    </div>
  )
}

function LoginFallback() {
  return (
    <div className="min-h-dvh bg-[var(--surface-0)] flex items-center justify-center px-4">
      <Spinner />
    </div>
  )
}

function Spinner({ light = false }: { light?: boolean }) {
  return (
    <svg className={`animate-spin h-4 w-4 ${light ? "text-white" : "text-[var(--ink-tertiary)]"}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}