import React from 'react';
import { notFound } from 'next/navigation';
import { commerceRepository } from '@/lib/data/providers';
import { Header } from '@/components/layout/header';
import { PromoBar } from '@/components/layout/promo-bar';
import { Footer } from '@/components/layout/footer';
import { CartDrawer } from '@/components/commerce/cart-drawer';
import { Container } from '@/components/common/container';
import { AddToCartButton } from '@/components/commerce/add-to-cart-button';
import { ProductGallery } from '@/components/commerce/product-gallery';
import { ProductTabs } from '@/components/commerce/product-tabs';
import { Clock, ShieldCheck, Truck } from 'lucide-react';

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
            {/* Gallery */}
            <ProductGallery images={product.images} productTitle={product.title} />

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
                {product.shortDescription}
              </p>

              {/* Add to Cart Interactive Island */}
              <div className="pt-4 border-t border-wine/10">
                <AddToCartButton product={product} />
              </div>

              <ProductTabs
                description={product.description}
                whatsIncluded={product.whatsIncluded}
                shippingInfo={product.shippingInfo}
                faqs={product.faqs}
              />

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
