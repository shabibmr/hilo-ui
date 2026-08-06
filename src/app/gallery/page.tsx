import React from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CartDrawer } from '@/components/commerce/cart-drawer';
import { Container } from '@/components/common/container';
import { SectionHeading } from '@/components/common/section-heading';
import { Heart, Sparkles } from 'lucide-react';

const GALLERY_ITEMS = [
  { id: 'g-1', title: 'Blooming Roses by Priya', category: 'Finished Hoop', location: 'Mumbai', likes: 142, tag: '@priya_stitches' },
  { id: 'g-2', title: 'Unboxing Evening Tea & Linen', category: 'Unboxing', location: 'Bengaluru', likes: 98, tag: '@slow.living.me' },
  { id: 'g-3', title: 'Moonlit Garden First Stitch', category: 'In Progress', location: 'Delhi', likes: 215, tag: '@ananya_art' },
  { id: 'g-4', title: 'Wildflower Meadow Framed', category: 'Framed Art', location: 'Pune', likes: 176, tag: '@crafts_by_rhea' },
  { id: 'g-5', title: 'Bridesmaid Gift Box Setup', category: 'Gifting', location: 'Hyderabad', likes: 310, tag: '@studio_decor' },
  { id: 'g-6', title: 'Lavender Dreams Relaxation', category: 'Finished Hoop', location: 'Jaipur', likes: 189, tag: '@quiet_hours' },
];

export default function GalleryPage() {
  return (
    <div className="min-h-screen flex flex-col bg-cream-warm text-wine font-body">
      <Header variant="solid" />

      <main className="flex-1 pt-10 pb-20">
        <Container>
          <SectionHeading
            eyebrow="REAL PEOPLE REAL STORIES"
            headline="Customer Gallery & Quiet Moments"
            subheadline="Explore finished artwork, unboxing rituals, and progress photos created by our community across India."
          />

          {/* Masonry Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {GALLERY_ITEMS.map((item) => (
              <div
                key={item.id}
                className="group bg-white rounded-2xl overflow-hidden ring-1 ring-wine/5 hover:border-gold/50 transition-all duration-300 hover:shadow-gold-glow flex flex-col justify-between"
              >
                <div className="relative aspect-[4/5] bg-wine/5 overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center bg-deep-wine text-antique-gold font-display text-xl">
                    {item.title}
                  </div>
                  <div className="absolute top-3 left-3 bg-wine/80 backdrop-blur-md text-antique-gold font-body text-[10px] uppercase tracking-wider px-3 py-1 rounded-full border border-gold/20 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-gold" />
                    <span>{item.category}</span>
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-medium text-wine">{item.title}</h3>
                    <div className="flex items-center gap-1 text-xs text-gold font-semibold">
                      <Heart className="w-4 h-4 fill-gold text-gold" />
                      <span>{item.likes}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-wine/60 font-light border-t border-wine/10 pt-3">
                    <span>{item.location}</span>
                    <span className="font-accent italic text-gold">{item.tag}</span>
                  </div>
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
