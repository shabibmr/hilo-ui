import { commerceRepository } from '@/lib/data/providers';
import { ProductView } from '@/components/pages/product-view';

// Handles known at build time get a static shell; the product itself is always fetched
// live in the browser. Products added later are reachable at /products/view/?handle=
export async function generateStaticParams() {
  const products = await commerceRepository.getProducts();
  return products.map((p) => ({ handle: p.handle }));
}

interface ProductPageProps {
  params: Promise<{ handle: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { handle } = await params;
  return <ProductView handle={handle} />;
}
