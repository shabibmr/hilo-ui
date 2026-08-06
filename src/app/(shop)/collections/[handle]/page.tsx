import React from 'react';
import { notFound } from 'next/navigation';
import { commerceRepository } from '@/lib/data/providers';
import { Header } from '@/components/layout/header';
import { PromoBar } from '@/components/layout/promo-bar';
import { Footer } from '@/components/layout/footer';
import { CartDrawer } from '@/components/commerce/cart-drawer';
import { Container } from '@/components/common/container';
import { ProductCard } from '@/components/commerce/product-card';

export async function generateStaticParams() {
  const collections = await commerceRepository.getCollections();
  return [
    { handle: 'all' },
    ...collections.map((c) => ({ handle: c.handle })),
    { handle: 'workshops' },
    { handle: 'customisation' },
  ];
}

interface CollectionPageProps {
  params: Promise<{ handle: string }>;
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { handle } = await params;
  const collection = await commerceRepository.getCollectionByHandle(handle);

  if (!collection && handle !== 'all') {
    notFound();
  }

  const products = await commerceRepository.getProducts({
    collectionHandle: handle === 'all' ? undefined : handle,
  });

  return (
    <div className="min-h-screen flex flex-col bg-cream text-wine font-body">
      <PromoBar />
      <Header variant="solid" />

      <main className="flex-1 pt-28 pb-20">
        <Container>
          {/* Collection Header Banner */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-eyebrow text-xs tracking-[0.25em] text-gold font-accent">
              — COLLECTION —
            </span>
            <h1 className="font-display text-h1 text-wine">
              {collection ? collection.title : 'All Embroidery Kits'}
            </h1>
            <p className="font-body text-base text-wine/70 font-light">
              {collection ? collection.description : 'Explore our complete library of beginner embroidery experiences.'}
            </p>
          </div>

          {/* Product Grid */}
          {products.length === 0 ? (
            <div className="text-center py-16 bg-white/50 rounded-xl border border-wine/10">
              <p className="font-display text-xl text-wine/60">No items found in this collection.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </Container>
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
}
