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

  // JWT strategy chosen deliberately: middleware runs on Edge and
  // cannot reach Prisma, so sessions must be self-contained tokens
  // that can be verified without a DB round-trip. auth.ts (Node)
  // inherits this same strategy via ...authConfig, so both runtimes
  // agree on how to read the session cookie.
  session: { strategy: "jwt" },

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

      if (!isLoggedIn && !isPublicPath) {
        return Response.redirect(new URL("/login", nextUrl))
      }

      if (isLoggedIn && nextUrl.pathname === "/login") {
        const destination =
          auth?.user?.onboardingComplete ? "/today" : "/onboarding"
        return Response.redirect(new URL(destination, nextUrl))
      }

      return true
    },

    // Runs whenever a JWT is created or updated.
    // `user` is only defined on the initial sign-in call — that's
    // when we copy fields from the DB user onto the token so they
    // persist across requests without needing a DB hit each time.
    // This callback must stay edge-safe: no Prisma calls here.
    async jwt({ token, user, trigger, session }) {
  if (user) {
    token.id = user.id
    token.onboardingComplete =
      (user as { onboardingComplete: boolean }).onboardingComplete ?? false
    token.identityStatement =
      (user as { identityStatement: string | null }).identityStatement ?? null
  }

  // Client explicitly called update() with new fields — merge them in.
  if (trigger === "update" && session) {
    if (session.onboardingComplete !== undefined) {
      token.onboardingComplete = session.onboardingComplete
    }
    if (session.identityStatement !== undefined) {
      token.identityStatement = session.identityStatement
    }
  }

  return token
},

    // Runs on every session read (client useSession(), server auth()).
    // Reads fields back off the token — never off `user`, which
    // jwt strategy does not reliably provide here.
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.onboardingComplete = token.onboardingComplete as boolean
        session.user.identityStatement = token.identityStatement as string | null
      }
      return session
    },
  },
} satisfies NextAuthConfig