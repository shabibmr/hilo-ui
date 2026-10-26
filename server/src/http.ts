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

/** Lightweight helmet-style headers. No extra dependency. */
export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
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
    const existing = hits.get(ip);
    const recent = existing ? existing.filter((t) => now - t < windowMs) : [];
    recent.push(now);
    hits.set(ip, recent);

    if (hits.size > 1000) {
      for (const [key, times] of hits.entries()) {
        if (times.every((t) => now - t >= windowMs)) {
          hits.delete(key);
        }
      }
    }

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

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

export type Pagination =
  | { enabled: false }
  | { enabled: true; page: number; limit: number; from: number; to: number };

/**
 * Opt-in pagination. Without `page` or `limit`, callers still get the full array.
 * With either param: page defaults to 1, limit to 50 (max 200). Body stays a JSON array;
 * totals go in `X-Total-Count`, `X-Page`, and `X-Limit`.
 */
export function readPagination(
  query: Request['query'],
  opts?: { defaultLimit?: number; maxLimit?: number }
): Pagination | { error: string } {
  const hasPage = query.page !== undefined && query.page !== '';
  const hasLimit = query.limit !== undefined && query.limit !== '';
  if (!hasPage && !hasLimit) return { enabled: false };

  const defaultLimit = opts?.defaultLimit ?? DEFAULT_PAGE_SIZE;
  const maxLimit = opts?.maxLimit ?? MAX_PAGE_SIZE;

  const pageRaw = hasPage ? Number(query.page) : 1;
  const limitRaw = hasLimit ? Number(query.limit) : defaultLimit;

  if (!Number.isInteger(pageRaw) || pageRaw < 1) {
    return { error: 'page must be a positive integer' };
  }
  if (!Number.isInteger(limitRaw) || limitRaw < 1 || limitRaw > maxLimit) {
    return { error: `limit must be an integer from 1 to ${maxLimit}` };
  }

  const from = (pageRaw - 1) * limitRaw;
  return { enabled: true, page: pageRaw, limit: limitRaw, from, to: from + limitRaw - 1 };
}

export function setPaginationHeaders(
  res: Response,
  total: number,
  page: number,
  limit: number
): void {
  res.setHeader('X-Total-Count', String(total));
  res.setHeader('X-Page', String(page));
  res.setHeader('X-Limit', String(limit));
  res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count, X-Page, X-Limit, X-Request-Id');
}

/** Parse CORS_ORIGIN into cors() `origin` option. `*` (or empty) reflects any origin for local dev. */
export function parseCorsOrigin(raw: string | undefined): boolean | string[] {
  const value = (raw ?? '*').trim();
  if (!value || value === '*') return true;
  const list = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length > 0 ? list : true;
}
