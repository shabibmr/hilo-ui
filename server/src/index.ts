import 'dotenv/config';
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { parseCorsOrigin, rateLimit, requestId, securityHeaders, sendError } from './http.js';
import { openApiDocument } from './openapi.js';
import catalog from './routes/catalog.js';
import admin from './routes/admin.js';
import checkout from './routes/checkout.js';
import content from './routes/content.js';
import webhooks from './routes/webhooks.js';
import { supabase } from './supabase.js';

const app = express();
const port = Number(process.env.PORT) || 4000;
const corsRaw = process.env.CORS_ORIGIN || '*';
const corsOrigin = parseCorsOrigin(corsRaw);

if (process.env.NODE_ENV === 'production' && (corsRaw.trim() === '*' || corsOrigin === true)) {
  console.warn(
    '[hilo-api] WARNING: CORS_ORIGIN is * in production. Set a comma-separated allow-list of storefront and admin origins.'
  );
}

app.set('trust proxy', 1);
app.use(requestId);
app.use(securityHeaders);
app.use(
  cors({
    origin: corsOrigin,
  })
);

// Webhook needs the raw body, so it is mounted before express.json().
app.use('/api/v1', webhooks);
app.use(express.json({ limit: '32kb' }));

const v1 = express.Router();
// Soft limit on all v1 traffic from a single IP (enquiries have a stricter limiter too).
v1.use(rateLimit(120, 60_000));
v1.get('/openapi.json', (_req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.json(openApiDocument);
});
v1.use(catalog);
v1.use(content);
v1.use(checkout);
v1.use(admin);
app.use('/api/v1', v1);

app.get('/health', async (_req, res) => {
  try {
    const { error } = await supabase.from('site_settings').select('id').eq('id', 1).maybeSingle();
    if (error) {
      sendError(res, 503, 'DB_UNAVAILABLE', error.message);
      return;
    }
    res.json({ ok: true, db: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Database check failed';
    sendError(res, 503, 'DB_UNAVAILABLE', message);
  }
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  if (res.headersSent) return;
  const message = err instanceof Error ? err.message : 'Internal server error';
  sendError(res, 500, 'INTERNAL_ERROR', message);
});

app.listen(port, () => {
  console.log(`hilo api listening on :${port}`);
});
