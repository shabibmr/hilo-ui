import { CommerceRepository, ContentRepository } from '../repository';
import { MockCommerceRepository, MockContentRepository } from './mock-provider';
import { SupabaseCommerceRepository, SupabaseContentRepository } from './supabase-provider';
import { ApiCommerceRepository, ApiContentRepository } from './api-provider';
import { isSupabaseConfigured } from '@/lib/supabase';

const isProd = process.env.NODE_ENV === 'production';

// Mock data is a local-development convenience only: a production build must
// name its provider explicitly so it can never silently ship sample products.
const provider =
  process.env.NEXT_PUBLIC_DATA_PROVIDER ||
  process.env.DATA_PROVIDER ||
  (isProd ? '' : 'mock');

if (provider !== 'mock' && provider !== 'supabase' && provider !== 'api') {
  throw new Error(
    '[Hilo Arte Data Provider] Set NEXT_PUBLIC_DATA_PROVIDER to "supabase", "api", or "mock" for production builds.'
  );
}

let commerceRepository: CommerceRepository;
let contentRepository: ContentRepository;

if (provider === 'api') {
  commerceRepository = new ApiCommerceRepository();
  contentRepository = new ApiContentRepository();
} else if (provider === 'supabase') {
  if (isSupabaseConfigured()) {
    commerceRepository = new SupabaseCommerceRepository();
    contentRepository = new SupabaseContentRepository();
  } else if (isProd) {
    throw new Error(
      '[Hilo Arte Data Provider] Provider is "supabase" but NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not configured.'
    );
  } else {
    console.warn(
      '[Hilo Arte Data Provider] Provider is "supabase" but Supabase is unconfigured. Falling back to the mock provider for local development.'
    );
    commerceRepository = new MockCommerceRepository();
    contentRepository = new MockContentRepository();
  }
} else {
  commerceRepository = new MockCommerceRepository();
  contentRepository = new MockContentRepository();
}

export { commerceRepository, contentRepository };
