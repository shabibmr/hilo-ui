/** Minimal OpenAPI 3 document for the public storefront read surface. */
export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Hilo Arte Storefront API',
    version: '1.0.0',
    description:
      'Published catalog, site settings, persistent carts, checkout, and enquiries. Admin and webhooks are also mounted under /api/v1.',
  },
  servers: [{ url: '/api/v1' }],
  paths: {
    '/products': {
      get: {
        summary: 'List published products',
        parameters: [
          { name: 'collection', in: 'query', schema: { type: 'string' } },
          {
            name: 'difficulty',
            in: 'query',
            schema: { type: 'string', enum: ['Beginner', 'Intermediate', 'Advanced'] },
          },
          { name: 'maxPrice', in: 'query', schema: { type: 'number', minimum: 0 } },
          {
            name: 'page',
            in: 'query',
            description: 'Opt-in page (1-based). With limit, sets X-Total-Count headers; body stays Product[].',
            schema: { type: 'integer', minimum: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Opt-in page size (default 50, max 200). Omit page and limit for the full list.',
            schema: { type: 'integer', minimum: 1, maximum: 200 },
          },
        ],
        responses: {
          '200': { description: 'Product[]' },
          '400': { description: 'Invalid query' },
          '429': { description: 'Rate limited' },
        },
      },
    },
    '/products/best-sellers': {
      get: {
        summary: 'Published best sellers',
        responses: { '200': { description: 'Product[]' } },
      },
    },
    '/products/id/{id}': {
      get: {
        summary: 'Published product by id',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Product' },
          '404': { description: 'Not found' },
        },
      },
    },
    '/products/{handle}': {
      get: {
        summary: 'Published product by handle',
        parameters: [{ name: 'handle', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Product' },
          '404': { description: 'Not found' },
        },
      },
    },
    '/collections': {
      get: {
        summary: 'List published collections',
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 200 },
          },
        ],
        responses: { '200': { description: 'Collection[]' } },
      },
    },
    '/collections/{handle}': {
      get: {
        summary: 'Published collection by handle (no embedded products)',
        parameters: [{ name: 'handle', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Collection' },
          '404': { description: 'Not found' },
        },
      },
    },
    '/settings': {
      get: {
        summary: 'Site settings singleton',
        responses: {
          '200': { description: 'SiteSettings' },
          '404': { description: 'Missing row' },
        },
      },
    },
    '/content/homepage': {
      get: {
        summary: 'Homepage editorial content with hero overlay',
        responses: {
          '200': { description: 'HomepageContent' },
        },
      },
    },
    '/content/founder': {
      get: {
        summary: 'Founder story content',
        responses: {
          '200': { description: 'FounderStoryContent' },
        },
      },
    },
    '/enquiries': {
      post: {
        summary: 'Create an enquiry',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'message'],
                properties: {
                  name: { type: 'string', minLength: 1, maxLength: 100 },
                  email: { type: 'string', format: 'email', maxLength: 254 },
                  message: { type: 'string', minLength: 1, maxLength: 5000 },
                  kind: { type: 'string', enum: ['contact', 'workshop'] },
                },
              },
            },
          },
        },
        responses: {
          '204': { description: 'Created (no body)' },
          '422': { description: 'Validation failed' },
          '429': { description: 'Rate limited' },
        },
      },
    },
    '/carts': {
      post: { summary: 'Create or restore a persistent anonymous cart', responses: { '201': { description: 'Cart identifier' }, '400': { description: 'Invalid cart identifier' } } },
    },
    '/carts/{cartId}': {
      get: { summary: 'Retrieve a current server-priced cart', parameters: [{ name: 'cartId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Cart with current catalog prices' }, '404': { description: 'Cart expired or not found' } } },
    },
    '/carts/{cartId}/items': {
      post: { summary: 'Add a product to a cart', parameters: [{ name: 'cartId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Updated cart' }, '409': { description: 'Stock or cart validation failed' } } },
    },
    '/carts/{cartId}/items/{lineId}': {
      patch: { summary: 'Set cart line quantity (zero removes the line)', parameters: [{ name: 'cartId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }, { name: 'lineId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Updated cart' }, '409': { description: 'Stock or cart validation failed' } } },
      delete: { summary: 'Remove a cart line', parameters: [{ name: 'cartId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }, { name: 'lineId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Updated cart' } } },
    },
    '/checkout/orders': {
      post: { summary: 'Create an order and Razorpay payment session', responses: { '201': { description: 'Order and gateway session created' }, '400': { description: 'Invalid checkout details' }, '409': { description: 'Stock or order validation failed' }, '502': { description: 'Payment gateway error' } } },
    },
    '/checkout/orders/{orderId}/cancel': {
      post: { summary: 'Cancel a pending checkout and release its stock reservation', parameters: [{ name: 'orderId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Order cancelled' }, '409': { description: 'Order is not cancellable' } } },
    },
    '/checkout/orders/{orderId}/status': {
      get: { summary: 'Read the public payment and order status', parameters: [{ name: 'orderId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Minimal payment status; no customer data' }, '404': { description: 'Order not found' } } },
    },
    '/openapi.json': {
      get: {
        summary: 'This OpenAPI document',
        responses: { '200': { description: 'OpenAPI 3 JSON' } },
      },
    },
  },
  components: {
    schemas: {
      Error: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'object', additionalProperties: true },
            },
          },
        },
      },
    },
  },
} as const;
