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
    <div className="min-h-screen flex flex-col bg-cream text-wine font-body">
      {/* Header Shell with integrated PromoBar */}
      <Header variant="overlay" />

      {/* Main Homepage Sections (9 Sections per Mockup & Spec) */}
      <main className="flex-1">
        {/* Section 1: Hero / The Arrival */}
        <HeroSection content={content.hero} />

        {/* Section 2: Bee-Guided Collections */}
        <CollectionsNavSection items={content.collectionsNav} />

        {/* Section 3: Why You'll Love HILO ARTE */}
        <WhyHiloSection cards={content.whyHiloCards} />

        {/* Section 4: Best Sellers */}
        <BestSellersSection products={bestSellers} />

        {/* Section 5: Founder Story Teaser */}
        <FounderTeaserSection content={content.founderTeaser} />

        {/* Section 6: What's Inside Your Kit */}
        <KitContentsSection items={content.kitContentsItems} />

        {/* Section 7: Creative Journey Timeline */}
        <CreativeJourneySection steps={content.creativeJourneySteps} />

        {/* Section 8: Newsletter Band */}
        <NewsletterSection />
      </main>

      {/* Footer & Global Cart Drawer */}
      <Footer />
      <CartDrawer />
    </div>
  );
}
