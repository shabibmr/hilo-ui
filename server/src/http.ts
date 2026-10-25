import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, RequestHandler, Response } from 'express';

export type ErrorBody = {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

export function sendError(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: Record<string, unknown>
): void {
  const body: ErrorBody = { error: { code, message } };
  if (details && Object.keys(details).length > 0) body.error.details = details;
  res.status(status).json(body);
}

/** Express 4 does not catch async rejections; forward them to the error handler. */
export const wrap =
  (fn: (req: Request, res: Response) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res).catch(next);
  };

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header('x-request-id');
  const id = incoming && incoming.trim() ? incoming.trim().slice(0, 64) : randomUUID();
  res.setHeader('X-Request-Id', id);
  (req as Request & { requestId?: string }).requestId = id;
  next();
}

/**
 * Simple fixed-window per-IP limiter. Returns true when the request should be rejected.
 * Shared Maps are fine for a single Node process on this host.
 */
export function createRateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return (ip: string): boolean => {
    const now = Date.now();
    const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
    recent.push(now);
    hits.set(ip, recent);
    return recent.length > limit;
  };
}

export function rateLimit(limit: number, windowMs: number): RequestHandler {
  const limited = createRateLimiter(limit, windowMs);
  return (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    if (limited(ip)) {
      res.setHeader('Retry-After', String(Math.ceil(windowMs / 1000)));
      sendError(res, 429, 'RATE_LIMITED', 'Too many requests. Please try again shortly.');
      return;
    }
    next();
  };
}
