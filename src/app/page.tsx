import { contentRepository, commerceRepository } from '@/lib/data/providers';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CartDrawer } from '@/components/commerce/cart-drawer';
import { HeroSection } from '@/components/sections/hero-section';
import { CollectionsNavSection } from '@/components/sections/collections-nav-section';
import { WhyHiloSection } from '@/components/sections/why-hilo-section';
import { BestSellersSection } from '@/components/sections/bestsellers-section';
import { FounderTeaserSection } from '@/components/sections/founder-teaser-section';
import { KitContentsSection } from '@/components/sections/kit-contents-section';
import { CreativeJourneySection } from '@/components/sections/creative-journey-section';
import { NewsletterSection } from '@/components/sections/newsletter-section';
import { DataErrorState } from '@/components/common/error-retry';
import type { HomepageContent, Product } from '@/lib/data/types';
import { MOCK_HOMEPAGE_CONTENT } from '@/lib/data/mock/homepage-content';

export default async function HomePage() {
  let content: HomepageContent = MOCK_HOMEPAGE_CONTENT;
  let bestSellers: Product[] = [];
  let error: string | null = null;

  try {
    content = await contentRepository.getHomepageContent();
    bestSellers = await commerceRepository.getBestSellers();
  } catch (err: unknown) {
    error = err instanceof Error ? err.message : 'Unable to connect to live studio catalog.';
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream-warm text-wine font-body">
      <Header variant="overlay" />

      <main className="flex-1">
        {error ? (
          <div className="py-24">
            <DataErrorState message={error} />
          </div>
        ) : (
          <>
            <HeroSection content={content.hero} />
            <CollectionsNavSection items={content.collectionsNav} />
            <WhyHiloSection cards={content.whyHiloCards} />
            <BestSellersSection products={bestSellers} />
            <FounderTeaserSection content={content.founderTeaser} />
            <KitContentsSection items={content.kitContentsItems} />
            <CreativeJourneySection steps={content.creativeJourneySteps} />
            <NewsletterSection />
          </>
        )}
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
}
