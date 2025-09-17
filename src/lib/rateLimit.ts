type Bucket = {
  tokens: number;
  lastRefill: number; // ms
};

export type RateLimitConfig = {
  points: number; // capacity
  durationMs: number; // refill window
};

export class InMemoryRateLimiter {
  private buckets = new Map<string, Bucket>();
  private readonly points: number;
  private readonly durationMs: number;

  constructor(cfg: RateLimitConfig) {
    this.points = cfg.points;
    this.durationMs = cfg.durationMs;
  }

  consume(key: string, cost = 1): { ok: boolean; retryAfterMs?: number } {
    const now = Date.now();
    const bucket = this.buckets.get(key) ?? { tokens: this.points, lastRefill: now };

    // Refill
    const elapsed = now - bucket.lastRefill;
    if (elapsed > 0) {
      const refill = (elapsed / this.durationMs) * this.points;
      bucket.tokens = Math.min(this.points, bucket.tokens + refill);
      bucket.lastRefill = now;
    }

    if (bucket.tokens >= cost) {
      bucket.tokens -= cost;
      this.buckets.set(key, bucket);
      return { ok: true };
    }

    const needed = cost - bucket.tokens;
    const retryAfterMs = Math.ceil((needed / this.points) * this.durationMs);
    this.buckets.set(key, bucket);
    return { ok: false, retryAfterMs };
  }
}

