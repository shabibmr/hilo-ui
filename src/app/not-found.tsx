import React from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Container } from '@/components/common/container';
import { CtaButton } from '@/components/common/cta-button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-cream-warm text-wine font-body">
      <Header variant="solid" />

      <main className="flex-1 pt-32 pb-20 flex items-center justify-center">
        <Container size="sm">
          <div className="bg-white p-12 rounded-2xl ring-1 ring-wine/5 text-center space-y-6">
            <span className="text-eyebrow text-xs tracking-[0.25em] text-gold font-accent block">
              — 404 —
            </span>
            <h1 className="font-display text-h1 text-wine">
              Stitch Not Found
            </h1>
            <p className="font-body text-base text-wine/70 font-light max-w-md mx-auto">
              The page you are looking for has unraveled or moved. Let us guide you back to our quiet homepage.
            </p>
            <div className="pt-4">
              <CtaButton href="/" variant="solid-gold">
                Back to Quiet Home
              </CtaButton>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
