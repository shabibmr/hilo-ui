import React from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { commerceRepository } from '@/lib/data/providers';
import { Header } from '@/components/layout/header';
import { PromoBar } from '@/components/layout/promo-bar';
import { Footer } from '@/components/layout/footer';
import { CartDrawer } from '@/components/commerce/cart-drawer';
import { Container } from '@/components/common/container';
import { AddToCartButton } from '@/components/commerce/add-to-cart-button';
import { Clock, CheckCircle2, ShieldCheck, Truck } from 'lucide-react';

export async function generateStaticParams() {
  const products = await commerceRepository.getProducts();
  return products.map((p) => ({ handle: p.handle }));
}

interface ProductPageProps {
  params: Promise<{ handle: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { handle } = await params;
  const product = await commerceRepository.getProductByHandle(handle);

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream text-wine font-body">
      <PromoBar />
      <Header variant="solid" />

      <main className="flex-1 pt-28 pb-20">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Gallery Image */}
            <div className="space-y-4">
              <div className="relative aspect-square rounded-2xl overflow-hidden border border-wine/10 bg-white shadow-wine-sm">
                {product.images[0]?.url ? (
                  <Image
                    src={product.images[0].url}
                    alt={product.title}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-display text-2xl text-wine/30">
                    HILO ARTE
                  </div>
                )}
              </div>
            </div>

            {/* Product Meta & Actions */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="bg-deep-wine text-antique-gold font-body text-xs uppercase tracking-wider px-3 py-1 rounded-full">
                  {product.difficulty}
                </span>
                <span className="text-xs text-wine/70 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gold" />
                  {product.estimatedHours} hours estimated
                </span>
              </div>

              <div>
                <h1 className="font-display text-h1 text-wine leading-tight">
                  {product.title}
                </h1>
                <p className="font-accent italic text-base text-gold mt-1">
                  {product.subtitle}
                </p>
              </div>

              <div className="text-2xl font-display font-semibold text-wine">
                ₹{product.price}
                <span className="text-xs font-body font-light text-wine/60 ml-2">Inclusive of all taxes</span>
              </div>

              <p className="font-body text-sm text-wine/80 leading-relaxed font-light">
                {product.description}
              </p>

              {/* Add to Cart Interactive Island */}
              <div className="pt-4 border-t border-wine/10">
                <AddToCartButton product={product} />
              </div>

              {/* What's Included */}
              <div className="bg-white/70 p-6 rounded-xl border border-wine/10 space-y-3">
                <h3 className="font-display text-lg font-medium text-wine">What&apos;s Inside Your Kit</h3>
                <ul className="space-y-2">
                  {product.whatsIncluded.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-wine/80 font-light">
                      <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Guarantee badges */}
              <div className="grid grid-cols-2 gap-4 pt-2 text-xs text-wine/70 font-light">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-gold" />
                  <span>Free Shipping over ₹1499</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-gold" />
                  <span>Handcrafted Quality Guarantee</span>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
}
