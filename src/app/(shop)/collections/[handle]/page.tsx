import { commerceRepository } from '@/lib/data/providers';
import { CollectionView } from '@/components/pages/collection-view';

// Static shells for collections known at build time; contents are fetched live in the browser.
export async function generateStaticParams() {
  try {
    const collections = await commerceRepository.getCollections();
    if (collections.length > 0) {
      return [{ handle: 'all' }, ...collections.map((c) => ({ handle: c.handle }))];
    }
  } catch {
    // API offline at build time: generate shells for default handles
  }
  return [{ handle: 'all' }, { handle: 'diy-kits' }];
}

interface CollectionPageProps {
  params: Promise<{ handle: string }>;
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { handle } = await params;
  return <CollectionView handle={handle} />;
}
