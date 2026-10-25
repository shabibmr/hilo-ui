import React from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Container } from '@/components/common/container';
import { SectionHeading } from '@/components/common/section-heading';

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-cream-warm text-wine font-body">
      <Header variant="solid" />

      <main className="flex-1 pt-10 pb-20">
        <Container size="sm">
          <SectionHeading
            eyebrow="DELIVERY INFORMATION"
            headline="Shipping & Delivery Policy"
            subheadline="Everything about our dispatch timelines and delivery across India."
          />

          <div className="bg-white p-8 sm:p-12 rounded-2xl ring-1 ring-wine/5 space-y-6 text-sm text-wine/80 font-light leading-relaxed">
            <h3 className="font-display text-xl text-wine font-medium">1. Order Dispatch Timelines</h3>
            <p>All embroidery kits are dispatched within 24 hours from our Jaipur studio. Orders placed on Sunday are dispatched the following Monday morning.</p>

            <h3 className="font-display text-xl text-wine font-medium">2. Shipping</h3>
            <p>Shipping is calculated when you place your order. The amount charged at payment is confirmed by our order system.</p>

            <h3 className="font-display text-xl text-wine font-medium">3. Transit Durations</h3>
            <p>Metro cities typically receive orders within 2 to 3 business days. Non-metro pin codes receive orders within 3 to 5 business days.</p>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
