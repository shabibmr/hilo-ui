import React from 'react';
import { Section } from '../common/section';
import { Container } from '../common/container';
import { SectionHeading } from '../common/section-heading';
import { ProductCard } from '../commerce/product-card';
import { Product } from '@/lib/data/types';
import { CtaButton } from '../common/cta-button';

interface BestSellersSectionProps {
  products: Product[];
}

export const BestSellersSection: React.FC<BestSellersSectionProps> = ({ products }) => {
  return (
    <Section variant="cream" id="bestsellers">
      <Container>
        <SectionHeading
          eyebrow="MOST LOVED EXPERIENCES"
          headline="Best Selling Embroidery Kits"
          subheadline="Hand-picked favorites chosen by stitchers beginning their quiet journey."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-12">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="text-center pt-4">
          <CtaButton href="/collections/diy-kits" variant="solid-wine" size="lg">
            View All DIY Kits
          </CtaButton>
        </div>
      </Container>
    </Section>
  );
};
