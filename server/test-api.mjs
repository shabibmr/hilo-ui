/**
 * Backend Read API Contract Verification Test
 *
 * Mirrors the hardened catalog/content contract:
 * - Published items only
 * - Collection filter via contains (Postgres @>)
 * - Error envelope { error: { code, message, details? } }
 * - Enquiry validation → 422; success → 204
 * - Product by id at /products/id/:id
 */

import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';

console.log('--- Running Hilo Arte Backend Read API Contract Tests ---');

const db = {
  products: [
    {
      id: 'p-1',
      handle: 'blooming-roses',
      title: 'Blooming Roses Kit',
      price: 1899,
      currency_code: 'INR',
      difficulty: 'Beginner',
      estimated_hours: 4,
      images: [{ url: '/images/roses.jpg', altText: 'Roses' }],
      collections: ['diy-kits'],
      tags: ['floral'],
      whats_included: ['Hoop', 'Threads'],
      shipping_info: 'Ships in 2-3 days',
      faqs: [{ question: 'Good for beginners?', answer: 'Yes!' }],
      is_best_seller: true,
      is_featured: true,
      stock: 5,
      published: true,
      created_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'p-2',
      handle: 'secret-garden-draft',
      title: 'Secret Garden Kit (Draft)',
      price: 2499,
      difficulty: 'Advanced',
      stock: 10,
      published: false,
      created_at: '2026-01-02T00:00:00Z',
    },
    {
      id: 'p-3',
      handle: 'lavender-dream',
      title: 'Lavender Dream Kit',
      price: 1299,
      difficulty: 'Intermediate',
      collections: ['diy-kits'],
      is_best_seller: false,
      stock: 0,
      published: true,
      created_at: '2026-01-03T00:00:00Z',
    },
  ],
  collections: [
    {
      id: 'c-1',
      handle: 'diy-kits',
      title: 'DIY Embroidery Kits',
      description: 'Everything you need.',
      image: { url: '/images/hero.jpg', altText: 'DIY Kits' },
      featured_product_handles: ['blooming-roses'],
      sort_order: 1,
      published: true,
    },
    {
      id: 'c-2',
      handle: 'draft-collection',
      title: 'Draft Collection',
      published: false,
    },
  ],
  site_settings: [
    {
      id: 1,
      hero: {
        eyebrow: 'Artisanal Craft',
        headline: 'Modern Embroidery',
        subheadline: 'Craft slow',
      },
      store: {
        name: 'Hilo Arte',
        address: 'Bandra West, Mumbai',
        phone: '+91 99999 99999',
        email: 'care@hiloarte.com',
        hours: '10am - 6pm',
        gstin: '27AAPFH1842Q1Z5',
      },
      social: {
        instagram: '@hiloarte',
      },
      announcement: 'Complimentary shipping over ₹1,499',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ],
  enquiries: [],
};

function createMockSupabase() {
  return {
    from(table) {
      let data = db[table] || [];
      let filters = [];
      let orders = [];
      let isMaybeSingle = false;

      const builder = {
        select() {
          return builder;
        },
        eq(col, val) {
          filters.push((row) => row[col] === val);
          return builder;
        },
        contains(col, needle) {
          const required = Array.isArray(needle) ? needle : [needle];
          filters.push((row) => {
            const arr = Array.isArray(row[col]) ? row[col] : [];
            return required.every((v) => arr.includes(v));
          });
          return builder;
        },
        lte(col, val) {
          filters.push((row) => Number(row[col]) <= val);
          return builder;
        },
        order(col, opts = { ascending: true }) {
          orders.push({ col, asc: opts.ascending !== false });
          return builder;
        },
        maybeSingle() {
          isMaybeSingle = true;
          return builder;
        },
        insert(rows) {
          if (Array.isArray(rows)) {
            data.push(...rows);
          } else {
            data.push(rows);
          }
          return Promise.resolve({ data: rows, error: null });
        },
        then(resolve) {
          let result = [...data];
          for (const f of filters) {
            result = result.filter(f);
          }
          if (orders.length > 0) {
            result.sort((a, b) => {
              for (const o of orders) {
                if (a[o.col] < b[o.col]) return o.asc ? -1 : 1;
                if (a[o.col] > b[o.col]) return o.asc ? 1 : -1;
              }
              return 0;
            });
          }
          if (isMaybeSingle) {
            return resolve({ data: result[0] || null, error: null });
          }
          return resolve({ data: result, error: null });
        },
      };
      return builder;
    },
  };
}

const mockSupabase = createMockSupabase();

function sendError(res, status, code, message, details) {
  const body = { error: { code, message } };
  if (details) body.error.details = details;
  res.status(status).json(body);
}

function buildTestApp() {
  const app = express();
  app.use((req, res, next) => {
    res.setHeader('X-Request-Id', req.header('x-request-id') || randomUUID());
    next();
  });
  app.use(cors());
  app.use(express.json());

  const v1 = express.Router();
  const DIFFICULTIES = new Set(['Beginner', 'Intermediate', 'Advanced']);
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const str = (v, fallback = '') => (typeof v === 'string' ? v : fallback);
  const list = (v) => (Array.isArray(v) ? v : []);

  function mapProduct(row) {
    const stock = Number(row.stock) || 0;
    const price = Number(row.price) || 0;
    const handle = str(row.handle);
    return {
      id: str(row.id),
      handle,
      title: str(row.title),
      subtitle: str(row.subtitle) || undefined,
      description: str(row.description),
      shortDescription: str(row.short_description) || str(row.description),
      price,
      currencyCode: str(row.currency_code, 'INR'),
      difficulty: str(row.difficulty, 'Beginner'),
      estimatedHours: Number(row.estimated_hours) || 0,
      images: list(row.images),
      collections: list(row.collections),
      tags: list(row.tags),
      whatsIncluded: list(row.whats_included),
      shippingInfo: str(row.shipping_info),
      faqs: list(row.faqs),
      isBestSeller: Boolean(row.is_best_seller),
      isFeatured: Boolean(row.is_featured),
      variants: [
        {
          id: `${row.id}-default`,
          title: 'Default',
          price,
          availableForSale: stock > 0,
          stock,
          sku: handle,
        },
      ],
    };
  }

  function mapCollection(row) {
    const image = row.image || null;
    return {
      id: str(row.id),
      handle: str(row.handle),
      title: str(row.title),
      description: str(row.description),
      image: image?.url
        ? image
        : { url: '/images/hero/hero-fairy-moon.jpg', altText: str(row.title) },
      featuredProductHandles: list(row.featured_product_handles),
    };
  }

  function mapSettings(row) {
    const hero = row.hero || {};
    const store = row.store || {};
    const social = row.social || {};
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
        backgroundImage: hero.backgroundImage || null,
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
      updated_at: str(row.updated_at, new Date().toISOString()),
    };
  }

  v1.get('/products/best-sellers', async (_req, res) => {
    const { data } = await mockSupabase
      .from('products')
      .select('*')
      .eq('is_best_seller', true)
      .eq('published', true);
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json((data || []).map(mapProduct));
  });

  v1.get('/products/id/:id', async (req, res) => {
    const { data } = await mockSupabase
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .eq('published', true)
      .maybeSingle();
    if (!data) return sendError(res, 404, 'NOT_FOUND', 'Product not found', { id: req.params.id });
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json(mapProduct(data));
  });

  v1.get('/products/:handle', async (req, res) => {
    const { data } = await mockSupabase
      .from('products')
      .select('*')
      .eq('handle', req.params.handle)
      .eq('published', true)
      .maybeSingle();
    if (!data) return sendError(res, 404, 'NOT_FOUND', 'Product not found', { handle: req.params.handle });
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json(mapProduct(data));
  });

  v1.get('/products', async (req, res) => {
    const collection = typeof req.query.collection === 'string' ? req.query.collection.trim() : undefined;
    const difficultyRaw =
      typeof req.query.difficulty === 'string' ? req.query.difficulty.trim() : undefined;
    const maxPriceRaw = typeof req.query.maxPrice === 'string' ? req.query.maxPrice.trim() : undefined;
    const fields = {};

    let difficulty;
    if (difficultyRaw) {
      if (!DIFFICULTIES.has(difficultyRaw)) fields.difficulty = 'Must be Beginner, Intermediate, or Advanced';
      else difficulty = difficultyRaw;
    }

    let maxPrice;
    if (maxPriceRaw !== undefined && maxPriceRaw !== '') {
      const n = Number(maxPriceRaw);
      if (!Number.isFinite(n) || n < 0) fields.maxPrice = 'Must be a number greater than or equal to 0';
      else maxPrice = n;
    }

    if (Object.keys(fields).length > 0) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid query parameters', { fields });
    }

    let query = mockSupabase.from('products').select('*').eq('published', true);
    if (difficulty) query = query.eq('difficulty', difficulty);
    if (maxPrice !== undefined) query = query.lte('price', maxPrice);
    if (collection && collection !== 'all') query = query.contains('collections', [collection]);

    const { data } = await query;
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json((data || []).map(mapProduct));
  });

  v1.get('/collections/:handle', async (req, res) => {
    const { data } = await mockSupabase
      .from('collections')
      .select('*')
      .eq('handle', req.params.handle)
      .eq('published', true)
      .maybeSingle();
    if (!data) return sendError(res, 404, 'NOT_FOUND', 'Collection not found', { handle: req.params.handle });
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json(mapCollection(data));
  });

  v1.get('/collections', async (_req, res) => {
    const { data } = await mockSupabase.from('collections').select('*').eq('published', true);
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json((data || []).map(mapCollection));
  });

  v1.get('/settings', async (_req, res) => {
    const { data } = await mockSupabase.from('site_settings').select('*').eq('id', 1).maybeSingle();
    if (!data) return sendError(res, 404, 'NOT_FOUND', 'Settings not found');
    res.setHeader('Cache-Control', 'public, max-age=30');
    res.json(mapSettings(data));
  });

  v1.post('/enquiries', async (req, res) => {
    const body = req.body || {};
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const kindRaw = typeof body.kind === 'string' ? body.kind.trim() : 'contact';
    const fields = {};
    if (!name) fields.name = 'Required';
    if (!email) fields.email = 'Required';
    else if (!EMAIL_RE.test(email)) fields.email = 'Must be a valid email address';
    if (!message) fields.message = 'Required';
    if (kindRaw !== 'contact' && kindRaw !== 'workshop') fields.kind = "Must be 'contact' or 'workshop'";
    if (Object.keys(fields).length > 0) {
      return sendError(res, 422, 'VALIDATION_ERROR', 'Request validation failed', { fields });
    }
    await mockSupabase.from('enquiries').insert({
      name,
      email,
      message,
      kind: kindRaw === 'workshop' ? 'workshop' : 'contact',
      handled: false,
    });
    res.status(204).send();
  });

  v1.get('/openapi.json', (_req, res) => {
    res.json({ openapi: '3.0.3', info: { title: 'test', version: '1.0.0' } });
  });

  app.use('/api/v1', v1);
  return app;
}

async function runTests() {
  const app = buildTestApp();
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/v1`;

  try {
    console.log('[TEST 1] GET /products returns only published items...');
    const res1 = await fetch(`${baseUrl}/products`);
    assert.strictEqual(res1.status, 200);
    assert.ok(res1.headers.get('cache-control')?.includes('max-age=60'));
    const prods = await res1.json();
    assert.strictEqual(prods.length, 2);
    assert.ok(!prods.some((p) => p.handle === 'secret-garden-draft'));
    console.log('✓ PASS');

    console.log('[TEST 2] Stock and availableForSale...');
    const roses = prods.find((p) => p.handle === 'blooming-roses');
    assert.strictEqual(roses.variants[0].stock, 5);
    assert.strictEqual(roses.variants[0].availableForSale, true);
    const lavender = prods.find((p) => p.handle === 'lavender-dream');
    assert.strictEqual(lavender.variants[0].stock, 0);
    assert.strictEqual(lavender.variants[0].availableForSale, false);
    console.log('✓ PASS');

    console.log('[TEST 3] Filters + invalid maxPrice...');
    const resFiltered = await fetch(
      `${baseUrl}/products?collection=diy-kits&difficulty=Beginner&maxPrice=2000`
    );
    assert.strictEqual(resFiltered.status, 200);
    const filteredProds = await resFiltered.json();
    assert.strictEqual(filteredProds.length, 1);
    assert.strictEqual(filteredProds[0].handle, 'blooming-roses');

    const resBad = await fetch(`${baseUrl}/products?maxPrice=nope`);
    assert.strictEqual(resBad.status, 400);
    const badBody = await resBad.json();
    assert.strictEqual(badBody.error.code, 'VALIDATION_ERROR');
    assert.ok(badBody.error.details.fields.maxPrice);
    console.log('✓ PASS');

    console.log('[TEST 4] Best sellers...');
    const resBS = await fetch(`${baseUrl}/products/best-sellers`);
    assert.strictEqual(resBS.status, 200);
    const bestSellers = await resBS.json();
    assert.strictEqual(bestSellers.length, 1);
    assert.strictEqual(bestSellers[0].handle, 'blooming-roses');
    console.log('✓ PASS');

    console.log('[TEST 5] Product by handle / id / 404 envelope...');
    const resProdFound = await fetch(`${baseUrl}/products/blooming-roses`);
    assert.strictEqual(resProdFound.status, 200);

    const resById = await fetch(`${baseUrl}/products/id/p-1`);
    assert.strictEqual(resById.status, 200);
    assert.strictEqual((await resById.json()).handle, 'blooming-roses');

    const resProdDraft = await fetch(`${baseUrl}/products/secret-garden-draft`);
    assert.strictEqual(resProdDraft.status, 404);
    const draftBody = await resProdDraft.json();
    assert.strictEqual(draftBody.error.code, 'NOT_FOUND');
    console.log('✓ PASS');

    console.log('[TEST 6] Collections without products array...');
    const resCol = await fetch(`${baseUrl}/collections/diy-kits`);
    assert.strictEqual(resCol.status, 200);
    const col = await resCol.json();
    assert.strictEqual(col.products, undefined);
    console.log('✓ PASS');

    console.log('[TEST 7] Settings...');
    const resSettings = await fetch(`${baseUrl}/settings`);
    assert.strictEqual(resSettings.status, 200);
    assert.ok(resSettings.headers.get('cache-control')?.includes('max-age=30'));
    db.site_settings = [];
    const resSettingsMissing = await fetch(`${baseUrl}/settings`);
    assert.strictEqual(resSettingsMissing.status, 404);
    console.log('✓ PASS');

    console.log('[TEST 8] Enquiries 204 / 422...');
    const resEnquiry = await fetch(`${baseUrl}/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        message: 'I love your embroidery kits!',
        kind: 'contact',
      }),
    });
    assert.strictEqual(resEnquiry.status, 204);
    assert.strictEqual(db.enquiries.length, 1);

    const resEnquiryInvalid = await fetch(`${baseUrl}/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Incomplete', email: 'not-an-email', message: '' }),
    });
    assert.strictEqual(resEnquiryInvalid.status, 422);
    const inv = await resEnquiryInvalid.json();
    assert.strictEqual(inv.error.code, 'VALIDATION_ERROR');
    assert.ok(inv.error.details.fields.email);
    assert.ok(inv.error.details.fields.message);
    console.log('✓ PASS');

    console.log('[TEST 9] OpenAPI + request id...');
    const resOas = await fetch(`${baseUrl}/openapi.json`, {
      headers: { 'X-Request-Id': 'test-req-1' },
    });
    assert.strictEqual(resOas.status, 200);
    assert.strictEqual(resOas.headers.get('x-request-id'), 'test-req-1');
    const oas = await resOas.json();
    assert.strictEqual(oas.openapi, '3.0.3');
    console.log('✓ PASS');

    console.log('\n======================================================');
    console.log('ALL BACKEND READ API CONTRACT TESTS PASSED');
    console.log('======================================================');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Test failure:', err);
  process.exit(1);
});
