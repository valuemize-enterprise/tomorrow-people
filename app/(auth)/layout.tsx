// Path: app/(auth)/layout.tsx
// Wraps /login and /signup in a centred, minimal shell.

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-[var(--surface-0)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">{children}</div>
    </main>
  )
}
