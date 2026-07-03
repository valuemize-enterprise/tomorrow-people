/**
 * lib/middleware/rate-limit.ts
 * FIX: Removed module-level setInterval — it leaked memory across serverless cold starts.
 * Stale entries are now pruned opportunistically on each write (same O(1) amortised cost).
 */

type Entry = { count: number; resetAt: number }

const store = new Map<string, Entry>()

// FIX: No more setInterval. Prune on every write instead.
// At scale (>10k users/min), swap this store for Upstash Redis.
function pruneStale() {
  const now = Date.now()
  // Only scan when map is large enough to bother
  if (store.size < 1000) return
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key)
  }
}

export type RateLimitOptions = {
  limit:    number
  windowMs: number
}

export async function rateLimit(
  identifier: string,
  { limit, windowMs }: RateLimitOptions,
): Promise<{ success: boolean; remaining: number; resetAt: number }> {
  const now = Date.now()
  const entry = store.get(identifier)

  if (!entry || entry.resetAt < now) {
    const resetAt = now + windowMs
    const newEntry = { count: 1, resetAt }
    store.set(identifier, newEntry)
    pruneStale()   // opportunistic cleanup instead of interval
    return { success: true, remaining: limit - 1, resetAt }
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { success: true, remaining: limit - entry.count, resetAt: entry.resetAt }
}

export const AUTH_LIMIT  = { limit: 10,  windowMs: 60_000 }
export const API_LIMIT   = { limit: 120, windowMs: 60_000 }
export const LOG_LIMIT   = { limit: 60,  windowMs: 60_000 }
export const CHAT_LIMIT  = { limit: 30,  windowMs: 60_000 }
export const CRON_LIMIT  = { limit: 5,   windowMs: 60_000 }
