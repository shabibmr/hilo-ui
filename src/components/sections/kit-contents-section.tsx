import React from 'react';
import { Section } from '../common/section';
import { Container } from '../common/container';
import { SectionHeading } from '../common/section-heading';
import { CtaButton } from '../common/cta-button';
import { HomepageContent } from '@/lib/data/types';
import { FileText, Circle, Feather, Pin, Smile, Book, QrCode, Layers, Folder } from 'lucide-react';

interface KitContentsSectionProps {
  items: HomepageContent['kitContentsItems'];
}

const iconMap: Record<string, React.ReactNode> = {
  FileText: <FileText className="w-5 h-5 text-gold" />,
  Circle: <Circle className="w-5 h-5 text-gold" />,
  Feather: <Feather className="w-5 h-5 text-gold" />,
  Pin: <Pin className="w-5 h-5 text-gold" />,
  Smile: <Smile className="w-5 h-5 text-gold" />,
  Book: <Book className="w-5 h-5 text-gold" />,
  QrCode: <QrCode className="w-5 h-5 text-gold" />,
  Layers: <Layers className="w-5 h-5 text-gold" />,
  Folder: <Folder className="w-5 h-5 text-gold" />,
};

export const KitContentsSection: React.FC<KitContentsSectionProps> = ({ items }) => {
  return (
    <Section variant="cream">
      <Container>
        <SectionHeading
          eyebrow="UNBOXING THE EXPERIENCE"
          headline="What's Inside Your Kit"
          subheadline="Everything you need to complete your artwork, beautifully packaged in our signature box."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white p-6 rounded-xl border border-wine/10 flex items-start gap-4 hover:border-gold/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-wine/5 flex items-center justify-center flex-shrink-0">
                {iconMap[item.icon] || <FileText className="w-5 h-5 text-gold" />}
              </div>
              <div>
                <h4 className="font-display text-lg font-medium text-wine">{item.name}</h4>
                <p className="font-body text-xs text-wine/60 font-light mt-0.5">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <CtaButton href="/coming-soon" variant="outline-gold">
            View Complete Kit Specifications
          </CtaButton>
        </div>
      </Container>
    </Section>
  );
};
