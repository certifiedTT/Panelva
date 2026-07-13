import { Request, Response, NextFunction } from "express";

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
}

interface ClientRequestRecord {
  timestamps: number[];
}

/**
 * Creates an Express sliding-window rate-limiting middleware.
 * Stores hits in memory with self-cleaning garbage collection.
 */
export function createRateLimiter(config: RateLimitConfig) {
  const clientRecords = new Map<string, ClientRequestRecord>();

  // Periodically clean up stale client entries to prevent memory leaks
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of clientRecords.entries()) {
      record.timestamps = record.timestamps.filter(
        (time) => now - time < config.windowMs
      );
      if (record.timestamps.length === 0) {
        clientRecords.delete(ip);
      }
    }
  }, config.windowMs);

  return (req: Request, res: Response, next: NextFunction): void => {
    // Resolve client IP (supporting reverse proxies if configured)
    const clientIp =
      (req.headers["x-forwarded-for"] as string) ||
      req.socket.remoteAddress ||
      "unknown-ip";

    const now = Date.now();
    
    let record = clientRecords.get(clientIp);
    if (!record) {
      record = { timestamps: [] };
      clientRecords.set(clientIp, record);
    }

    // Filter out timestamps outside the sliding window
    record.timestamps = record.timestamps.filter(
      (time) => now - time < config.windowMs
    );

    if (record.timestamps.length >= config.max) {
      res.status(429).json({
        status: "fail",
        error: config.message,
      });
      return;
    }

    record.timestamps.push(now);
    next();
  };
}

// 1. Standard Endpoints: Max 100 requests per 15 minutes
export const standardLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests. Please try again after 15 minutes.",
});

// 2. Sensitive Authentication Routes: Max 5 requests per 1 minute
export const authLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
  message: "Too many sign-in or registration attempts. Please try again in 1 minute.",
});
