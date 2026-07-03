/**
 * lib/cron/coaching.ts
 *
 * Weekly coaching cron — runs Saturday 06:00 UTC.
 * Generates a behaviour analysis for every active user and
 * caches it so Sunday morning it's instantly available.
 *
 * Called by app/api/cron/weekly/route.ts (already protected by withCron).
 */

import { prisma } from "@/lib/prisma"
import { buildCoachingContext } from "@/lib/services/context.service"
import { getBehaviourAnalysis } from "@/lib/services/coaching.service"

export async function runWeeklyCoachingCron(): Promise<{
  processed: number
  errors:    number
}> {
  const users = await prisma.user.findMany({
    where:  { habits: { some: { isActive: true } } },
    select: { id: true, timezone: true },
  })

  let processed = 0
  let errors    = 0

  for (const user of users) {
    try {
      const ctx = await buildCoachingContext(user.id)

      // Skip users with no habit data (nothing to analyse)
      if (ctx.activeHabits.length === 0) continue

      await getBehaviourAnalysis(ctx, user.id)
      processed++

      // Throttle to avoid rate-limit on Claude API
      // 3 req/s safe for claude-sonnet-4-20250514 on standard tier
      await new Promise((r) => setTimeout(r, 350))
    } catch (err) {
      console.error(`[cron/coaching] Failed for user ${user.id}:`, err)
      errors++
    }
  }

  console.log(`[cron/coaching] Done — ${processed} analyses generated, ${errors} errors`)
  return { processed, errors }
}
