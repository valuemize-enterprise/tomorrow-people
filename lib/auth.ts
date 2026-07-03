import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Google from "next-auth/providers/google"
import { prisma } from "@/lib/prisma"
import { authConfig } from "@/lib/auth.config"

// ─────────────────────────────────────────────────────────────────
// Full config — used only in Node.js (API routes, Server Actions).
// Includes adapter + providers which cannot run in edge runtime.
// This file must NEVER be imported from middleware.ts.
// ─────────────────────────────────────────────────────────────────
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  adapter: PrismaAdapter(prisma),

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Request only the minimum scopes needed.
      authorization: {
        params: {
          scope: "openid email profile",
        },
      },
    }),
  ],

  events: {
    // Fires once after a brand-new User row is inserted.
    // Use this to run any post-signup side-effects.
    async createUser({ user }) {
      // No-op for now. Streak rows are created when the first
      // Habit is saved, not at sign-up time.
      console.log(`[auth] new user: ${user.email}`)
    },
  },

  // Database sessions (not JWT) are the default when an adapter is set.
  // This means session data lives in the DB and session tokens are opaque.
  // session: { strategy: "database" },  ← this is the implicit default
})