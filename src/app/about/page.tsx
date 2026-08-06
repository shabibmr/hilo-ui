import React from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CartDrawer } from '@/components/commerce/cart-drawer';
import { Container } from '@/components/common/container';
import { SectionHeading } from '@/components/common/section-heading';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-cream text-wine font-body">
      <Header variant="solid" />

      <main className="flex-1 pt-28 pb-20">
        <Container>
          <SectionHeading
            eyebrow="BRAND PHILOSOPHY"
            headline="Crafted for quiet hours & slow creativity."
            subheadline="HILO ARTE is not a craft supply marketplace. It is a slow luxury creative universe."
          />

          <div className="max-w-3xl mx-auto space-y-8 font-body text-base text-wine/80 font-light leading-relaxed">
            <p>
              In a world measured by speed and notifications, HILO ARTE stands for the gentle pause. Soft washed linen stretched inside a wooden hoop. Golden thread moving quietly under moonlight. A warm cup of tea beside an open window.
            </p>
            <p>
              We believe that creativity does not require prior expertise or years of practice. It only requires a quiet hour and a thoughtful kit designed to welcome you with ease.
            </p>
          </div>
        </Container>
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
}
