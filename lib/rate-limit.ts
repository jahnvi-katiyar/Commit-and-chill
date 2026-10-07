/**
 * Minimal in-memory sliding-window rate limiter.
 *
 * Best-effort only: state is per server instance, so on serverless platforms
 * use a shared store (e.g. Upstash/Redis) for strict limits.
 */
const hits = new Map<string, number[]>()

export function rateLimit(key: string, limit = 10, windowMs = 60_000): { ok: boolean; retryAfter: number } {
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  if (recent.length >= limit) {
    hits.set(key, recent)
    return { ok: false, retryAfter: Math.ceil((windowMs - (now - recent[0])) / 1000) }
  }
  recent.push(now)
  hits.set(key, recent)

  // Opportunistic cleanup so the map can't grow without bound.
  if (hits.size > 5_000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k)
  }
  return { ok: true, retryAfter: 0 }
}
