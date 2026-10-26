import { Router, type Request, type Response } from 'express';
import { buildHomepageContent, FOUNDER_STORY } from '../content.js';
import { rateLimit, sendError, wrap } from '../http.js';
import { supabase } from '../supabase.js';

type DbRow = Record<string, unknown>;
type ImageAsset = { url: string; altText: string; width?: number; height?: number };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_MAX = 100;
const EMAIL_MAX = 254;
const MESSAGE_MAX = 5000;

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);

function mapSettings(row: DbRow) {
  const hero = (row.hero && typeof row.hero === 'object' ? row.hero : {}) as Record<string, unknown>;
  const store = (row.store && typeof row.store === 'object' ? row.store : {}) as Record<string, unknown>;
  const social = (row.social && typeof row.social === 'object' ? row.social : {}) as Record<
    string,
    unknown
  >;
  const bg = hero.backgroundImage as ImageAsset | null | undefined;

  return {
    id: typeof row.id === 'number' ? row.id : 1,
    hero: {
      eyebrow: str(hero.eyebrow),
      headline: str(hero.headline),
      subheadline: str(hero.subheadline),
      primaryCtaText: str(hero.primaryCtaText),
      primaryCtaLink: str(hero.primaryCtaLink),
      secondaryCtaText: str(hero.secondaryCtaText),
      secondaryCtaLink: str(hero.secondaryCtaLink),
      backgroundImage: bg?.url ? bg : null,
    },
    store: {
      name: str(store.name),
      address: str(store.address),
      phone: str(store.phone),
      email: str(store.email),
      hours: str(store.hours),
      gstin: str(store.gstin),
    },
    social: {
      instagram: str(social.instagram),
      pinterest: str(social.pinterest),
      whatsapp: str(social.whatsapp),
    },
    announcement: row.announcement == null ? null : str(row.announcement),
    // Keep snake_case to match SiteSettings in the storefront.
    updated_at: str(row.updated_at, new Date().toISOString()),
  };
}

const router = Router();

router.get(
  '/settings',
  wrap(async (_req: Request, res: Response) => {
    const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle();

    if (error) {
      sendError(res, 500, 'DB_ERROR', error.message);
      return;
    }
    if (!data) {
      sendError(res, 404, 'NOT_FOUND', 'Settings not found');
      return;
    }
    res.setHeader('Cache-Control', 'public, max-age=30');
    res.json(mapSettings(data));
  })
);

router.post(
  '/enquiries',
  rateLimit(5, 60_000),
  wrap(async (req: Request, res: Response) => {
    const body = req.body as {
      name?: unknown;
      email?: unknown;
      message?: unknown;
      kind?: unknown;
    };

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const kindRaw = typeof body.kind === 'string' ? body.kind.trim() : 'contact';

    const fields: Record<string, string> = {};
    if (!name) fields.name = 'Required';
    else if (name.length > NAME_MAX) fields.name = `Must be at most ${NAME_MAX} characters`;

    if (!email) fields.email = 'Required';
    else if (email.length > EMAIL_MAX) fields.email = `Must be at most ${EMAIL_MAX} characters`;
    else if (!EMAIL_RE.test(email)) fields.email = 'Must be a valid email address';

    if (!message) fields.message = 'Required';
    else if (message.length > MESSAGE_MAX) fields.message = `Must be at most ${MESSAGE_MAX} characters`;

    if (kindRaw !== 'contact' && kindRaw !== 'workshop') {
      fields.kind = "Must be 'contact' or 'workshop'";
    }

    if (Object.keys(fields).length > 0) {
      sendError(res, 422, 'VALIDATION_ERROR', 'Request validation failed', { fields });
      return;
    }

    const kind = kindRaw === 'workshop' ? 'workshop' : 'contact';

    const { error } = await supabase.from('enquiries').insert([
      {
        name,
        email,
        message,
        kind,
        handled: false,
      },
    ]);

    if (error) {
      sendError(res, 500, 'DB_ERROR', error.message);
      return;
    }
    res.status(204).send();
  })
);

router.get(
  '/content/homepage',
  wrap(async (_req: Request, res: Response) => {
    const { data } = await supabase.from('site_settings').select('hero').eq('id', 1).maybeSingle();
    const heroSettings = (data?.hero && typeof data.hero === 'object') ? (data.hero as Record<string, unknown>) : null;
    const content = buildHomepageContent(heroSettings);
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json(content);
  })
);

router.get(
  '/content/founder',
  wrap(async (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json(FOUNDER_STORY);
  })
);

export default router;
