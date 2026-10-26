import { commerceRepository } from '@/lib/data/providers';
import { CollectionView } from '@/components/pages/collection-view';

// Static shells for collections known at build time; contents are fetched live in the browser.
export async function generateStaticParams() {
  const collections = await commerceRepository.getCollections();
  return collections.map((c) => ({ handle: c.handle }));
}

interface CollectionPageProps {
  params: Promise<{ handle: string }>;
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { handle } = await params;
  return <CollectionView handle={handle} />;
}
