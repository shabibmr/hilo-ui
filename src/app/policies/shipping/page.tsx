import React from 'react';
import { Header } from '@/components/layout/header';
import { PromoBar } from '@/components/layout/promo-bar';
import { Footer } from '@/components/layout/footer';
import { Container } from '@/components/common/container';
import { SectionHeading } from '@/components/common/section-heading';

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-cream text-wine font-body">
      <PromoBar />
      <Header variant="solid" />

      <main className="flex-1 pt-28 pb-20">
        <Container size="sm">
          <SectionHeading
            eyebrow="DELIVERY INFORMATION"
            headline="Shipping & Delivery Policy"
            subheadline="Everything about our dispatch timelines and free shipping thresholds across India."
          />

          <div className="bg-white p-8 sm:p-12 rounded-2xl border border-wine/10 space-y-6 text-sm text-wine/80 font-light leading-relaxed">
            <h3 className="font-display text-xl text-wine font-medium">1. Order Dispatch Timelines</h3>
            <p>All embroidery kits are dispatched within 24 hours from our Jaipur studio. Orders placed on Sunday are dispatched the following Monday morning.</p>

            <h3 className="font-display text-xl text-wine font-medium">2. Free Shipping Threshold</h3>
            <p>We offer complimentary express shipping across India for all orders above ₹1499. Orders below ₹1499 incur a flat ₹99 shipping charge.</p>

            <h3 className="font-display text-xl text-wine font-medium">3. Transit Durations</h3>
            <p>Metro cities typically receive orders within 2 to 3 business days. Non-metro pin codes receive orders within 3 to 5 business days.</p>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
