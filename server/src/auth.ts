import type { NextFunction, Request, Response } from 'express';
import { supabase } from './supabase.js';

/**
 * Verifies a Supabase access token and checks ADMIN_USER_IDS.
 * Express 4 requires rejected async middleware promises to be forwarded explicitly.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  void verifyAdmin(req, res).then(
    () => next(),
    (error: unknown) => next(error)
  );
}

async function verifyAdmin(req: Request, res: Response): Promise<void> {
  const header = req.header('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    res.status(401).json({ error: 'Missing bearer token' });
    return;
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  const admins = (process.env.ADMIN_USER_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (!admins.includes(data.user.id)) {
    res.status(403).json({ error: 'Not authorised' });
  }
}
