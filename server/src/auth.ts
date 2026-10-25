import type { NextFunction, Request, Response } from 'express';
import { supabase } from './supabase.js';

/**
 * Verifies the Supabase access token and checks the user against ADMIN_USER_IDS
 * (comma-separated user ids). Fails closed: with the list unset nobody is admin.
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.header('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return res.status(401).json({ error: 'Missing bearer token' });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ error: 'Invalid or expired token' });

  const admins = (process.env.ADMIN_USER_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (!admins.includes(data.user.id)) return res.status(403).json({ error: 'Not authorised' });

  next();
}
