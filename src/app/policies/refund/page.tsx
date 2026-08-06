import React from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Container } from '@/components/common/container';
import { SectionHeading } from '@/components/common/section-heading';

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-cream text-wine font-body">
      <Header variant="solid" />

      <main className="flex-1 pt-28 pb-20">
        <Container size="sm">
          <SectionHeading
            eyebrow="GENTLE GUARANTEE"
            headline="Refund & Return Policy"
            subheadline="Our commitment to your peace of mind and complete satisfaction."
          />

          <div className="bg-white p-8 sm:p-12 rounded-2xl border border-wine/10 space-y-6 text-sm text-wine/80 font-light leading-relaxed">
            <h3 className="font-display text-xl text-wine font-medium">1. 7-Day Gentle Return Window</h3>
            <p>If you receive your kit and decide it is not for you, you may return unopened, unused kit boxes within 7 days of delivery for a full refund.</p>

            <h3 className="font-display text-xl text-wine font-medium">2. Damaged or Missing Items</h3>
            <p>If any component (needles, hoop, thread, linen) arrives damaged or incomplete, contact studio support on WhatsApp or email and we will send a replacement immediately.</p>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
