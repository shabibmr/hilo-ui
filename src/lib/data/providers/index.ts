import { CommerceRepository, ContentRepository } from '../repository';
import { MockCommerceRepository, MockContentRepository } from './mock-provider';

const provider = process.env.DATA_PROVIDER || 'mock';

let commerceRepository: CommerceRepository;
let contentRepository: ContentRepository;

switch (provider) {
  case 'shopify':
    // Future Shopify Storefront API implementation will go here
    commerceRepository = new MockCommerceRepository();
    contentRepository = new MockContentRepository();
    break;
  case 'mock':
  default:
    commerceRepository = new MockCommerceRepository();
    contentRepository = new MockContentRepository();
    break;
}

export { commerceRepository, contentRepository };
