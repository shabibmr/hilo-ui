import { CommerceRepository, ContentRepository } from '../repository';
import { ApiCommerceRepository, ApiContentRepository } from './api-provider';

if (!process.env.NEXT_PUBLIC_API_URL) {
  throw new Error('[Hilo Arte Data Provider] NEXT_PUBLIC_API_URL is not configured.');
}

const commerceRepository: CommerceRepository = new ApiCommerceRepository();
const contentRepository: ContentRepository = new ApiContentRepository();

export { commerceRepository, contentRepository };
