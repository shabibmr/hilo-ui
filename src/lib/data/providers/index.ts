import { getApiBaseUrl } from '@/lib/api-url';
import { CommerceRepository, ContentRepository } from '../repository';
import { ApiCommerceRepository, ApiContentRepository } from './api-provider';

getApiBaseUrl();

const commerceRepository: CommerceRepository = new ApiCommerceRepository();
const contentRepository: ContentRepository = new ApiContentRepository();

export { commerceRepository, contentRepository, getApiBaseUrl };
