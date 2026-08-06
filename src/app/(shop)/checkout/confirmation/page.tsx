import React from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Container } from '@/components/common/container';
import { CtaButton } from '@/components/common/cta-button';
import { CheckCircle2 } from 'lucide-react';

export default function ConfirmationPage() {
  return (
    <div className="min-h-screen flex flex-col bg-cream text-wine font-body">
      <Header variant="solid" />

      <main className="flex-1 pt-32 pb-20 flex items-center justify-center">
        <Container size="sm">
          <div className="bg-white p-8 sm:p-12 rounded-2xl border border-wine/10 text-center space-y-6 shadow-wine-sm">
            <div className="w-16 h-16 bg-wine/5 rounded-full flex items-center justify-center text-gold mx-auto border border-gold/30">
              <CheckCircle2 className="w-10 h-10 stroke-[1.5]" />
            </div>

            <span className="text-eyebrow text-xs tracking-[0.25em] text-gold font-accent block">
              — ORDER CONFIRMED —
            </span>

            <h1 className="font-display text-h1 text-wine">
              Your quiet box is on its way.
            </h1>

            <p className="font-body text-base text-wine/70 font-light max-w-md mx-auto leading-relaxed">
              Thank you for starting your embroidery journey with HILO ARTE. We have received your order and are carefully preparing your presentation kit.
            </p>

            <div className="pt-4">
              <CtaButton href="/" variant="solid-gold">
                Return to Homepage
              </CtaButton>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
