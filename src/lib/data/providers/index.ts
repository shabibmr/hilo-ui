import { CommerceRepository, ContentRepository } from '../repository';
import { MockCommerceRepository, MockContentRepository } from './mock-provider';
import { SupabaseCommerceRepository, SupabaseContentRepository } from './supabase-provider';
import { isSupabaseConfigured } from '@/lib/supabase';

const provider =
  process.env.NEXT_PUBLIC_DATA_PROVIDER || process.env.DATA_PROVIDER || 'mock';

let commerceRepository: CommerceRepository;
let contentRepository: ContentRepository;

if (provider === 'supabase') {
  if (isSupabaseConfigured() || process.env.NODE_ENV === 'production') {
    commerceRepository = new SupabaseCommerceRepository();
    contentRepository = new SupabaseContentRepository();
  } else {
    console.warn(
      '[Hilo Arte Data Provider] DATA_PROVIDER is "supabase" but NEXT_PUBLIC_SUPABASE_URL is unconfigured. Falling back to Mock Provider for local development.'
    );
    commerceRepository = new MockCommerceRepository();
    contentRepository = new MockContentRepository();
  }
} else {
  commerceRepository = new MockCommerceRepository();
  contentRepository = new MockContentRepository();
}

export { commerceRepository, contentRepository };
