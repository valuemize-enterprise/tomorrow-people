import type { NextAuthConfig } from "next-auth"

// ─────────────────────────────────────────────────────────────────
// Edge-safe config. NO Prisma import in this file, directly or
// transitively — that's what makes it safe to import from
// middleware.ts (which always runs on the Edge Runtime).
// ─────────────────────────────────────────────────────────────────
export const authConfig = {
    // NextAuth() always calls providers.map() internally during init,
  // even in the edge-safe config that never actually uses a provider
  // for sign-in. Must be present (even empty) or middleware crashes.
  providers: [],
  pages: {
    signIn: "/login",
    error: "/login",           // errors append ?error= to this URL
    verifyRequest: "/login",   // shown after magic link is sent
  },

  callbacks: {
    // Controls which routes are accessible without a session.
    // Runs on every request matched by middleware — keep it fast.
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user

      const isPublicPath =
        nextUrl.pathname === "/" ||
        nextUrl.pathname === "/login" ||
        nextUrl.pathname.startsWith("/api/auth")

      // Unauthenticated user hitting a protected route → redirect to login
      if (!isLoggedIn && !isPublicPath) {
        return Response.redirect(new URL("/login", nextUrl))
      }

      // Logged-in user hitting /login → redirect to app
      if (isLoggedIn && nextUrl.pathname === "/login") {
        const destination =
          auth?.user?.onboardingComplete ? "/today" : "/onboarding"
        return Response.redirect(new URL(destination, nextUrl))
      }

      return true
    },

    // Runs after a DB session is fetched. Attach extra user fields
    // so they're available on the client via useSession().
    // NOTE: this callback only runs in the full (Node) auth instance,
    // never in middleware, so referencing `user` here is still safe.
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        // Cast because Prisma User has these fields; DefaultUser does not.
        session.user.onboardingComplete =
          (user as { onboardingComplete: boolean }).onboardingComplete ?? false
        session.user.identityStatement =
          (user as { identityStatement: string | null }).identityStatement ??
          null
      }
      return session
    },
  },
} satisfies NextAuthConfig