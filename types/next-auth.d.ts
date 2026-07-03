// Augment NextAuth's built-in Session and User types with the
// extra fields we store on the User model in Prisma.
//
// Without this file TypeScript will error when you access
// session.user.id, session.user.onboardingComplete, etc.

import type { DefaultSession, DefaultUser } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      /** Prisma User.id (cuid) */
      id: string
      /** False until the user completes the anchor-collection step */
      onboardingComplete: boolean
      /** e.g. "a person who trains every morning" */
      identityStatement: string | null
    } & DefaultSession["user"] // keeps name, email, image
  }

  interface User extends DefaultUser {
    onboardingComplete: boolean
    identityStatement: string | null
  }
}
