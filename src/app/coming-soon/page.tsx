import React from 'react';
import { Header } from '@/components/layout/header';
import { PromoBar } from '@/components/layout/promo-bar';
import { Footer } from '@/components/layout/footer';
import { Container } from '@/components/common/container';
import { CtaButton } from '@/components/common/cta-button';

export default function ComingSoonPage() {
  return (
    <div className="min-h-screen flex flex-col bg-cream text-wine font-body">
      <PromoBar />
      <Header variant="solid" />

      <main className="flex-1 pt-32 pb-20 flex items-center justify-center">
        <Container size="sm">
          <div className="bg-white p-12 rounded-2xl border border-wine/10 text-center space-y-6">
            <span className="text-eyebrow text-xs tracking-[0.25em] text-gold font-accent block">
              — PHASE 2 UNIVERSE —
            </span>
            <h1 className="font-display text-h1 text-wine">
              Coming Soon
            </h1>
            <p className="font-body text-base text-wine/70 font-light max-w-md mx-auto">
              This experience is currently being handcrafted for our Phase 2 release. Subscribe to our Quiet Letters for early access announcements.
            </p>
            <div className="pt-4">
              <CtaButton href="/" variant="solid-gold">
                Explore DIY Kits
              </CtaButton>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
