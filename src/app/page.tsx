'use client';

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
import { useLive } from '@/lib/data/use-live';

export default function HomePage() {
  const { data, error, loading, reload } = useLive(async () => {
    const [content, bestSellers] = await Promise.all([
      contentRepository.getHomepageContent(),
      commerceRepository.getBestSellers(),
    ]);
    return { content, bestSellers };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-cream-warm text-wine font-body">
      <Header variant="overlay" />

      <main className="flex-1">
        {error ? (
          <div className="py-24">
            <DataErrorState message={error} onRetry={reload} />
          </div>
        ) : loading || !data ? (
          <div className="min-h-[70vh]" aria-busy="true" />
        ) : (
          <>
            <HeroSection content={data.content.hero} />
            <CollectionsNavSection items={data.content.collectionsNav} />
            <WhyHiloSection cards={data.content.whyHiloCards} />
            <BestSellersSection products={data.bestSellers} />
            <FounderTeaserSection content={data.content.founderTeaser} />
            <KitContentsSection items={data.content.kitContentsItems} />
            <CreativeJourneySection steps={data.content.creativeJourneySteps} />
            <NewsletterSection />
          </>
        )}
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
}
