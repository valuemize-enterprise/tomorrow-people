// Server-only. Import only from Server Components, Route Handlers,
// or Server Actions — never from "use client" files.

import { prisma } from "@/lib/prisma"

// ─── Read ─────────────────────────────────────────────────────────

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
  })
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  })
}

// ─── Onboarding ───────────────────────────────────────────────────

/**
 * Called at the end of the onboarding flow once the user has named
 * their existing morning anchor habit (e.g. "make coffee").
 */
export async function completeOnboarding(userId: string, anchor: string) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      onboardingAnchor: anchor,
      onboardingComplete: true,
    },
  })
}

// ─── Identity ─────────────────────────────────────────────────────

/**
 * Stores the user's self-declared identity statement.
 * Displayed on the /progress page and after all daily habits are logged.
 * Example: "a person who trains and reads every morning"
 */
export async function updateIdentityStatement(
  userId: string,
  statement: string,
) {
  return prisma.user.update({
    where: { id: userId },
    data: { identityStatement: statement },
  })
}

// ─── Timezone ─────────────────────────────────────────────────────

/**
 * Persists the user's IANA timezone (e.g. "Africa/Lagos").
 * Used by the notification service to schedule morning reminders
 * at the correct local time, and by the cron to bucket daily logs.
 */
export async function updateTimezone(userId: string, timezone: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { timezone },
  })
}
