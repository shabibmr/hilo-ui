'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Section } from '../common/section';
import { Container } from '../common/container';
import { SectionHeading } from '../common/section-heading';
import { FlowerBloom } from '../motion/flower-bloom';
import { HomepageContent } from '@/lib/data/types';
import { Sparkles, Gift, Scissors, BookOpen, Palette } from 'lucide-react';

interface CollectionsNavSectionProps {
  items: HomepageContent['collectionsNav'];
}

const iconMap: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="w-6 h-6 text-gold" />,
  Gift: <Gift className="w-6 h-6 text-gold" />,
  Scissors: <Scissors className="w-6 h-6 text-gold" />,
  BookOpen: <BookOpen className="w-6 h-6 text-gold" />,
  Palette: <Palette className="w-6 h-6 text-gold" />,
};

export const CollectionsNavSection: React.FC<CollectionsNavSectionProps> = ({ items }) => {
  const [activeHandle, setActiveHandle] = useState<string | null>(null);

  return (
    <Section variant="cream">
      <Container>
        <SectionHeading
          eyebrow="EXPLORE THE UNIVERSE"
          headline="Bee-Guided Collections"
          subheadline="Choose your entrance into slow living and quiet creativity."
        />

        {/* Mobile: horizontal scroll-snap carousel. Desktop (md+): 5-col grid. */}
        <div className="flex md:grid md:grid-cols-5 gap-6 sm:gap-8 overflow-x-auto snap-x snap-mandatory md:overflow-visible pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
          {items.map((item) => {
            const targetHref = item.handle === 'workshops' ? '/workshops' : item.handle === 'customisation' ? '/customisation' : `/collections/${item.handle}`;

            return (
              <Link
                key={item.handle}
                href={targetHref}
                onMouseEnter={() => setActiveHandle(item.handle)}
                onMouseLeave={() => setActiveHandle((current) => (current === item.handle ? null : current))}
                onFocus={() => setActiveHandle(item.handle)}
                onBlur={() => setActiveHandle((current) => (current === item.handle ? null : current))}
                className="group relative flex flex-col items-center text-center p-6 bg-white rounded-xl border border-wine/10 transition-all duration-300 hover:border-gold hover:shadow-gold-glow shrink-0 w-[42vw] sm:w-[220px] md:w-auto snap-start"
              >
                {/* Hoop Wreath Icon Container */}
                <div className="w-20 h-20 rounded-full bg-wine/5 border border-gold/30 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:bg-wine/10 relative">
                  <FlowerBloom active={activeHandle === item.handle} size={80} />
                  {iconMap[item.iconName] || <Sparkles className="w-6 h-6 text-gold" />}

                  {/* Outer Hoop Ring Accent */}
                  <div className="absolute inset-0 rounded-full border border-gold/20 scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                <h3 className="font-display text-lg font-medium text-wine group-hover:text-gold transition-colors">
                  {item.title}
                </h3>

                {item.badge && (
                  <span className="mt-2 text-[10px] uppercase font-body font-semibold tracking-wider text-antique-gold bg-wine/5 px-2.5 py-0.5 rounded-full border border-gold/20">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </Container>
    </Section>
  );
};
