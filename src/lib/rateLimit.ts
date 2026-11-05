// src/lib/rateLimit.ts
// Lightweight sliding-window in-memory rate limiter per IP / client

interface RateLimitRecord {
  timestamps: number[];
}

const windowMap = new Map<string, RateLimitRecord>();

/**
 * Checks whether the client has exceeded the max allowed requests within the time window.
 * Default: 15 requests per 60 seconds.
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 15,
  windowMs: number = 60 * 1000
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const record = windowMap.get(key) || { timestamps: [] };

  // Filter timestamps within current window
  const validTimestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (validTimestamps.length >= maxRequests) {
    const oldest = validTimestamps[0];
    const resetMs = windowMs - (now - oldest);
    return { allowed: false, remaining: 0, resetMs };
  }

  // Record this request
  validTimestamps.push(now);
  windowMap.set(key, { timestamps: validTimestamps });

  return {
    allowed: true,
    remaining: maxRequests - validTimestamps.length,
    resetMs: windowMs,
  };
}

