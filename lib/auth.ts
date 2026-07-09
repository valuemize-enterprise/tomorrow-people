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

  // NOTE: authConfig explicitly sets session strategy to "jwt" (see
// auth.config.ts). This overrides the database-session default that
// would otherwise apply since an adapter is present. JWT was chosen
// so middleware (Edge runtime, no Prisma access) can verify sessions
// without a DB round-trip. The adapter is still used for account
// linking, user lookup, and the `user` object passed into the jwt()
// callback on sign-in.
})