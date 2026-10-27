/**
 * Real-route HTTP tests: boots the actual Express routers from src/ with the
 * Supabase client replaced by an in-memory fake, then drives them over HTTP.
 */
import assert from 'node:assert/strict';
import http from 'node:http';
import { before, after, mock, test } from 'node:test';
import express from 'express';
import { createFakeSupabase } from './fake-supabase.mjs';

const db = {
  collections: [
    { id: 'c-1', handle: 'with-image', title: 'With Image', image: { url: '/images/a.jpg', altText: 'A' }, published: true },
    { id: 'c-2', handle: 'no-image', title: 'No Image', image: null, published: true },
  ],
  rpc: {},
};
const fake = createFakeSupabase(db);

// Checkout reads the gateway keys at import time; make the suite independent of the developer's env.
delete process.env.RAZORPAY_KEY_ID;
delete process.env.RAZORPAY_KEY_SECRET;

mock.module('../src/supabase.ts', { namedExports: { supabase: fake.client } });

let server;
let base;

before(async () => {
  const { default: catalog } = await import('../src/routes/catalog.ts');
  const { default: checkout } = await import('../src/routes/checkout.ts');
  const app = express();
  app.use(express.json());
  app.use('/api/v1', catalog);
  app.use('/api/v1', checkout);
  server = http.createServer(app);
  await new Promise((r) => server.listen(0, r));
  base = `http://127.0.0.1:${server.address().port}/api/v1`;
});

after(() => server.close());

test('collection without an image returns image: null, not a stock photo', async () => {
  const res = await fetch(`${base}/collections/no-image`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.image, null);
});

const order = {
  customer: { name: 'A B', email: 'a@b.co', shippingAddress: { line1: '1 St', city: 'Kochi' } },
  items: [{ productId: 'p-1', quantity: 1 }],
};

test('checkout with payments not configured is refused before any stock is reserved', async () => {
  fake.calls.rpc.length = 0;
  const res = await fetch(`${base}/checkout/orders`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(order),
  });
  assert.equal(res.status, 503);
  assert.equal((await res.json()).error.code, 'PAYMENT_UNAVAILABLE');
  assert.equal(fake.calls.rpc.filter((c) => c.name === 'create_order_atomic').length, 0);
});
