// In-memory sliding window — valid because the app runs as a single Node process on one
// droplet (see architecture.md's Hosting section). Would need a shared store (e.g. Redis) the
// moment this runs as more than one instance.
const requestLog = new Map<string, number[]>();

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

export function checkRateLimit(key: string, maxRequests: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;
  const timestamps = (requestLog.get(key) ?? []).filter((ts) => ts > windowStart);

  if (timestamps.length >= maxRequests) {
    const retryAfterSeconds = Math.ceil((timestamps[0] + windowMs - now) / 1000);
    requestLog.set(key, timestamps);
    return { allowed: false, retryAfterSeconds };
  }

  timestamps.push(now);
  requestLog.set(key, timestamps);
  return { allowed: true };
}
