// A simple in-memory rate limiter for serverless environments.
// Note: In Vercel Edge/Serverless, memory is not shared across lambda instances.
// This provides basic protection per instance. For robust rate limiting, use Redis (e.g. Upstash).

const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record) {
    rateLimitMap.set(key, { count: 1, timestamp: now });
    return true;
  }

  if (now - record.timestamp > windowMs) {
    // Reset window
    rateLimitMap.set(key, { count: 1, timestamp: now });
    return true;
  }

  if (record.count >= limit) {
    return false; // Rate limit exceeded
  }

  record.count += 1;
  return true;
}
