import React from 'react';
import { contentRepository } from '@/lib/data/providers';
import { Header } from '@/components/layout/header';
import { PromoBar } from '@/components/layout/promo-bar';
import { Footer } from '@/components/layout/footer';
import { CartDrawer } from '@/components/commerce/cart-drawer';
import { Container } from '@/components/common/container';

export default async function FounderStoryPage() {
  const story = await contentRepository.getFounderStory();

  return (
    <div className="min-h-screen flex flex-col bg-cream text-wine font-body">
      <PromoBar />
      <Header variant="solid" />

      <main className="flex-1 pt-28 pb-20">
        <Container size="sm">
          <div className="text-center space-y-4 mb-12">
            <span className="text-eyebrow text-xs tracking-[0.25em] text-gold font-accent">
              — OUR FOUNDER —
            </span>
            <h1 className="font-display text-h1 text-wine">
              {story.headline}
            </h1>
            <p className="font-accent italic text-lg text-gold font-normal">
              {story.subheadline}
            </p>
          </div>

          <div className="space-y-6 font-body text-base text-wine/80 font-light leading-relaxed bg-white/70 p-8 rounded-2xl border border-wine/10">
            {story.storyParagraphs.map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}

            <blockquote className="border-l-2 border-gold pl-6 py-2 my-8 font-accent italic text-xl text-gold font-normal">
              &ldquo;{story.quote}&rdquo;
            </blockquote>
          </div>
        </Container>
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
}
