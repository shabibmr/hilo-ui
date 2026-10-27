'use client';

import React from 'react';
import Link from 'next/link';
import { commerceRepository } from '@/lib/data/providers';
import { useLive } from '@/lib/data/use-live';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CartDrawer } from '@/components/commerce/cart-drawer';
import { Container } from '@/components/common/container';
import { ProductCard } from '@/components/commerce/product-card';
import { DataErrorState } from '@/components/common/error-retry';
import { collectionHref } from '@/lib/links';

export function CollectionView({ handle }: { handle: string }) {
  const { data, error, loading, reload } = useLive(async () => {
    const collection = await commerceRepository.getCollectionByHandle(handle);
    if (!collection && handle !== 'all') return { collection: null, products: [], missing: true };
    const products = await commerceRepository.getProducts({
      collectionHandle: handle === 'all' ? undefined : handle,
    });
    return { collection, products, missing: false };
  }, [handle]);
  const collection = data?.collection ?? null;
  const products = data?.products ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-cream-warm text-wine font-body">
      <Header variant="solid" />

      <main className="flex-1 pt-10 pb-20">
        <Container>
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="inline-flex items-center rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-gold bg-gold/[0.08] ring-1 ring-gold/25">
              Collection
            </span>
            <h1 className="font-display text-h1 text-wine">
              {collection ? collection.title : handle === 'all' ? 'All Embroidery Kits' : ''}
            </h1>
            <p className="font-body text-base text-wine/70 font-light">
              {collection
                ? collection.description
                : 'Explore our complete library of beginner embroidery experiences.'}
            </p>
          </div>

          {error ? (
            <DataErrorState message={error} onRetry={reload} />
          ) : loading ? (
            <div className="min-h-[40vh]" aria-busy="true" />
          ) : data?.missing ? (
            <div className="text-center py-16 space-y-3">
              <p className="font-display text-xl text-wine/70">This collection doesn&apos;t exist.</p>
              <Link href={collectionHref('all')} className="inline-block text-gold underline">
                Browse all kits
              </Link>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 bg-white/50 rounded-[2rem] ring-1 ring-wine/5">
              <p className="font-display text-xl text-wine/60">
                No items found in this collection.
              </p>
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
