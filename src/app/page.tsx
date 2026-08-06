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

export default async function HomePage() {
  const content = await contentRepository.getHomepageContent();
  const bestSellers = await commerceRepository.getBestSellers();

  return (
    <div className="min-h-screen flex flex-col bg-cream-warm text-wine font-body">
      <Header variant="overlay" />

      <main className="flex-1">
        <HeroSection content={content.hero} />
        <CollectionsNavSection items={content.collectionsNav} />
        <WhyHiloSection cards={content.whyHiloCards} />
        <BestSellersSection products={bestSellers} />
        <FounderTeaserSection content={content.founderTeaser} />
        <KitContentsSection items={content.kitContentsItems} />
        <CreativeJourneySection steps={content.creativeJourneySteps} />
        <NewsletterSection />
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
}
