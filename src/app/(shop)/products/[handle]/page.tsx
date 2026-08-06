import React from 'react';
import { notFound } from 'next/navigation';
import { commerceRepository } from '@/lib/data/providers';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CartDrawer } from '@/components/commerce/cart-drawer';
import { Container } from '@/components/common/container';
import { AddToCartButton } from '@/components/commerce/add-to-cart-button';
import { ProductGallery } from '@/components/commerce/product-gallery';
import { ProductTabs } from '@/components/commerce/product-tabs';
import { DoubleBezel } from '@/components/common/double-bezel';
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
    <div className="min-h-screen flex flex-col bg-cream-warm text-wine font-body">
      <Header variant="solid" />

      <main className="flex-1 pt-10 pb-24">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <DoubleBezel className="shadow-wine-sm">
              <ProductGallery images={product.images} productTitle={product.title} />
            </DoubleBezel>

            <div className="space-y-6">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="bg-deep-wine text-antique-gold font-body text-[10px] uppercase tracking-[0.14em] font-semibold px-3 py-1 rounded-full ring-1 ring-gold/30">
                  {product.difficulty}
                </span>
                <span className="text-xs text-wine/70 flex items-center gap-1.5 font-light">
                  <Clock className="w-3.5 h-3.5 text-gold" strokeWidth={1.25} />
                  {product.estimatedHours} hours estimated
                </span>
              </div>

              <div>
                <h1 className="font-display text-h1 text-wine leading-tight">{product.title}</h1>
                <p className="font-accent italic text-base text-gold mt-1">{product.subtitle}</p>
              </div>

              <div className="text-2xl font-display font-medium text-wine">
                ₹{product.price}
                <span className="text-xs font-body font-light text-wine/60 ml-2">
                  Inclusive of all taxes
                </span>
              </div>

              <p className="font-body text-sm text-wine/75 leading-relaxed font-light">
                {product.shortDescription}
              </p>

              <div className="pt-4 border-t border-wine/5">
                <AddToCartButton product={product} />
              </div>

              <ProductTabs
                description={product.description}
                whatsIncluded={product.whatsIncluded}
                shippingInfo={product.shippingInfo}
                faqs={product.faqs}
              />

              <div className="grid grid-cols-2 gap-4 pt-2 text-xs text-wine/70 font-light">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-gold" strokeWidth={1.25} />
                  <span>Free Shipping over ₹1499</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-gold" strokeWidth={1.25} />
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
