/**
 * config/env.ts — validates ALL env vars at cold start.
 * A missing variable throws immediately with a clear message.
 * FIXED: Added ANTHROPIC_API_KEY (was missing, caused silent 500s on coaching routes)
 */

import { z } from "zod"

const schema = z.object({
  // ── Database ──────────────────────────────────────────────────
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL connection string"),
  DIRECT_URL:   z.string().url().optional(),

  // ── NextAuth ──────────────────────────────────────────────────
  AUTH_SECRET:   z.string().min(32, "AUTH_SECRET must be ≥ 32 characters. Run: npx auth secret"),
  NEXTAUTH_URL:  z.string().url().optional().refine(
    (v) => process.env.NODE_ENV !== "production" || !!v,
    "NEXTAUTH_URL is required in production",
  ),

  // ── OAuth ─────────────────────────────────────────────────────
  GOOGLE_CLIENT_ID:     z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),


  // ── Cron ─────────────────────────────────────────────────────
  // FIX: min(32) ensures empty string never passes validation.
  CRON_SECRET: z.string().min(32, "CRON_SECRET must be ≥ 32 chars. Run: openssl rand -hex 32"),

  // ── AI (FIXED: was missing entirely) ─────────────────────────
  ANTHROPIC_API_KEY: z
    .string()
    .startsWith("sk-ant-", "ANTHROPIC_API_KEY must start with 'sk-ant-'. Get one at console.anthropic.com"),

  // ── Runtime ───────────────────────────────────────────────────
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
})

function validateEnv() {
  const result = schema.safeParse(process.env)

  if (!result.success) {
    const lines = result.error.issues
      .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
      .join("\n")

    // Crash immediately with a developer-friendly message
    throw new Error(
      `\n\n❌  Environment variable validation failed:\n\n${lines}\n\n` +
      "→ Copy .env.example to .env and fill in every value before starting.\n",
    )
  }

  return result.data
}

export const env =
  process.env.NODE_ENV === "test"
    ? (process.env as unknown as z.infer<typeof schema>)
    : validateEnv()
