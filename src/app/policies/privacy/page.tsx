import React from 'react';
import { Header } from '@/components/layout/header';
import { PromoBar } from '@/components/layout/promo-bar';
import { Footer } from '@/components/layout/footer';
import { Container } from '@/components/common/container';
import { SectionHeading } from '@/components/common/section-heading';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-cream text-wine font-body">
      <PromoBar />
      <Header variant="solid" />

      <main className="flex-1 pt-28 pb-20">
        <Container size="sm">
          <SectionHeading
            eyebrow="LEGAL & TRUST"
            headline="Privacy Policy"
            subheadline="How we respect and protect your personal information at HILO ARTE."
          />

          <div className="bg-white p-8 sm:p-12 rounded-2xl border border-wine/10 space-y-6 text-sm text-wine/80 font-light leading-relaxed">
            <h3 className="font-display text-xl text-wine font-medium">1. Information Collection</h3>
            <p>We collect information you provide directly when placing an order, subscribing to our Quiet Letters newsletter, or contacting studio support. This includes name, delivery address, email, and phone number.</p>

            <h3 className="font-display text-xl text-wine font-medium">2. Use of Information</h3>
            <p>Your information is used solely to process orders, deliver your physical kits, send order tracking updates, and deliver gentle seasonal newsletters if you subscribed.</p>

            <h3 className="font-display text-xl text-wine font-medium">3. Data Security</h3>
            <p>All checkout transactions are processed through encrypted 256-bit SSL connections. We never sell or share your personal data with third-party advertisers.</p>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
