import Link from "next/link"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!session.user.onboardingComplete) redirect("/onboarding")

  return (
    <div className="min-h-dvh bg-[var(--surface-0)]">
      {/* Content — padded above nav */}
      <main className="pb-nav">{children}</main>

      {/* Bottom nav — glassmorphism + active dot indicator */}
      <nav className="bottom-nav">
        <div className="max-w-lg mx-auto px-2 flex items-stretch h-[58px]">
          <NavItem href="/today"    label="Today"    icon={<TodayIcon />}    />
          <NavItem href="/habits"   label="Stack"    icon={<StackIcon />}    />
          <NavItem href="/progress" label="Progress" icon={<ProgressIcon />} />
          <NavItem href="/partner"  label="Partner"  icon={<PartnerIcon />}  />
        </div>
      </nav>
    </div>
  )
}

// ─── Nav item ─────────────────────────────────────────────────────
// Active state is handled by CSS [aria-current] — no JS needed.

function NavItem({
  href,
  label,
  icon,
}: {
  href: string
  label: string
  icon: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="
        flex-1 flex flex-col items-center justify-center gap-[3px]
        text-[var(--ink-tertiary)] transition-colors duration-150
        hover:text-[var(--ink-secondary)]
        [&.active]:text-[var(--ink-primary)]
        group relative
      "
    >
      {/* Active dot */}
      <span
        className="
          absolute top-2 w-1 h-1 rounded-full bg-[var(--accent)]
          opacity-0 transition-opacity
          group-[[aria-current='page']]:opacity-100
        "
        aria-hidden
      />
      <span className="transition-transform duration-150 group-hover:-translate-y-px">
        {icon}
      </span>
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
    </Link>
  )
}

// ─── Icons — refined stroke weight, consistent 20×20 ─────────────

function TodayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="3" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" />
    </svg>
  )
}
function StackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  )
}
function ProgressIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
}
function PartnerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
