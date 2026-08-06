import React from 'react';
import { contentRepository } from '@/lib/data/providers';
import { Header } from '@/components/layout/header';
import { PromoBar } from '@/components/layout/promo-bar';
import { Footer } from '@/components/layout/footer';
import { CartDrawer } from '@/components/commerce/cart-drawer';
import { Container } from '@/components/common/container';
import { SectionHeading } from '@/components/common/section-heading';
import { CtaButton } from '@/components/common/cta-button';
import { BeeCompanion } from '@/components/motion/bee-companion';
import { FileText, Circle, Feather, Pin, Smile, Book, QrCode, Layers, Folder } from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  FileText: <FileText className="w-8 h-8 text-gold" />,
  Circle: <Circle className="w-8 h-8 text-gold" />,
  Feather: <Feather className="w-8 h-8 text-gold" />,
  Pin: <Pin className="w-8 h-8 text-gold" />,
  Smile: <Smile className="w-8 h-8 text-gold" />,
  Book: <Book className="w-8 h-8 text-gold" />,
  QrCode: <QrCode className="w-8 h-8 text-gold" />,
  Layers: <Layers className="w-8 h-8 text-gold" />,
  Folder: <Folder className="w-8 h-8 text-gold" />,
};

export default async function WhatsInsidePage() {
  const content = await contentRepository.getHomepageContent();

  return (
    <div className="min-h-screen flex flex-col bg-cream text-wine font-body">
      <PromoBar />
      <Header variant="solid" />

      <main className="flex-1 pt-28 pb-20">
        <Container>
          <SectionHeading
            eyebrow="ANATOMY OF A LUXURY KIT"
            headline="What's Inside Your Kit"
            subheadline="An exploded view of every piece, fabric, and tool selected for your slow creative journey."
          />

          <div className="flex justify-center mb-8">
            <BeeCompanion size={40} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {content.kitContentsItems.map((item) => (
              <div
                key={item.id}
                className="bg-white p-8 rounded-2xl border border-wine/10 hover:border-gold transition-all duration-300 hover:shadow-gold-glow flex flex-col items-center text-center space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-wine/5 flex items-center justify-center border border-gold/30">
                  {iconMap[item.icon] || <FileText className="w-8 h-8 text-gold" />}
                </div>
                <h3 className="font-display text-xl font-medium text-wine">{item.name}</h3>
                <p className="font-body text-sm text-wine/70 font-light leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <CtaButton href="/collections/diy-kits" size="lg">
              Start Your First Stitch
            </CtaButton>
          </div>
        </Container>
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
}
