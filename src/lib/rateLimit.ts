/**
 * In-memory rate limiter for API routes.
 * Uses a sliding window approach with configurable limits.
 * 
 * Usage:
 *   const limiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 500 })
 *   const { success } = await limiter.check(10, identifier)
 */

const tokenCache = new Map<string, { count: number; expiresAt: number }>()

// Cleanup stale entries every 60 seconds
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, value] of tokenCache) {
      if (value.expiresAt < now) tokenCache.delete(key)
    }
  }, 60_000)
}

interface RateLimitConfig {
  interval: number          // Time window in ms
  uniqueTokenPerInterval: number  // Max unique tokens tracked
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

export function rateLimit(config: RateLimitConfig = { interval: 60_000, uniqueTokenPerInterval: 500 }) {
  return {
    check: (limit: number, token: string): RateLimitResult => {
      const now = Date.now()
      const key = token

      const entry = tokenCache.get(key)

      if (!entry || entry.expiresAt < now) {
        // New or expired — start fresh
        tokenCache.set(key, { count: 1, expiresAt: now + config.interval })
        return { success: true, limit, remaining: limit - 1, reset: now + config.interval }
      }

      if (entry.count >= limit) {
        return { success: false, limit, remaining: 0, reset: entry.expiresAt }
      }

      entry.count++
      return { success: true, limit, remaining: limit - entry.count, reset: entry.expiresAt }
    }
  }
}

// Pre-configured limiters for common use cases
export const authLimiter = rateLimit({ interval: 15 * 60 * 1000, uniqueTokenPerInterval: 500 }) // 15 min window
export const apiLimiter = rateLimit({ interval: 60 * 1000, uniqueTokenPerInterval: 500 })        // 1 min window

/**
 * Helper to extract client IP from request headers
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()

  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp

  return '127.0.0.1'
}
