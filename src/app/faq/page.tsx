import React from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CartDrawer } from '@/components/commerce/cart-drawer';
import { Container } from '@/components/common/container';
import { SectionHeading } from '@/components/common/section-heading';

const FAQ_CATEGORIES = [
  {
    category: 'Beginner Stitching & Lessons',
    items: [
      { q: 'I have never embroidered before. Is this suitable for me?', a: 'Yes! Over 80% of our stitchers have zero prior experience. Each kit includes pre-printed water-soluble outlines and access to step-by-step video tutorials.' },
      { q: 'How do the video lessons work?', a: 'Inside your kit box is a guidebook with a QR code. Scanning it opens slow-motion video stitch guides for every technique used in your kit.' },
    ],
  },
  {
    category: 'Materials & Care',
    items: [
      { q: 'What fabric is used in the kits?', a: 'We use 100% natural organic washed linen crafted in India. The ink for the printed outline is non-toxic and dissolves completely in warm water once completed.' },
      { q: 'What happens if I run out of thread?', a: 'We include generous full skeins of DMC thread (over 30% extra floss per shade). If you ever need additional thread, reach out and we will send skeins free of charge.' },
    ],
  },
  {
    category: 'Shipping & Delivery',
    items: [
      { q: 'How long does shipping take across India?', a: 'Orders are dispatched within 24 hours from our Jaipur studio. Express delivery typically arrives in 2 to 4 business days.' },
      { q: 'Is free shipping available?', a: 'Yes! All orders over ₹1499 qualify for complimentary express shipping across India.' },
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="min-h-screen flex flex-col bg-cream text-wine font-body">
      <Header variant="solid" />

      <main className="flex-1 pt-28 pb-20">
        <Container size="sm">
          <SectionHeading
            eyebrow="HELP & GUIDANCE"
            headline="Frequently Asked Questions"
            subheadline="Everything you need to know about our kits, materials, shipping, and guided lessons."
          />

          <div className="space-y-12">
            {FAQ_CATEGORIES.map((cat, idx) => (
              <div key={idx} className="space-y-4">
                <h3 className="font-display text-2xl font-medium text-wine border-b border-wine/10 pb-2">
                  {cat.category}
                </h3>
                <div className="space-y-4 pt-2">
                  {cat.items.map((item, i) => (
                    <div key={i} className="bg-white p-6 rounded-xl border border-wine/10 space-y-2">
                      <h4 className="font-display text-lg font-medium text-wine">{item.q}</h4>
                      <p className="font-body text-sm text-wine/70 font-light leading-relaxed">{item.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
}
