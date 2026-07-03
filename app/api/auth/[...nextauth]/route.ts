// Path: app/api/auth/[...nextauth]/route.ts
// The [...nextauth] catch-all folder is REQUIRED — without it NextAuth
// cannot handle /api/auth/callback/google, /api/auth/session, etc.

import { handlers } from "@/lib/auth"

export const { GET, POST } = handlers
