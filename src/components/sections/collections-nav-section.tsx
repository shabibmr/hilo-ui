'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Section } from '../common/section';
import { Container } from '../common/container';
import { SectionHeading } from '../common/section-heading';
import { DoubleBezel } from '../common/double-bezel';
import { HomepageContent } from '@/lib/data/types';

interface CollectionsNavSectionProps {
  items: HomepageContent['collectionsNav'];
}

const collectionImages: Record<string, string> = {
  'diy-kits': '/images/collections/diy-kits.jpg',
  'gift-experiences': '/images/collections/gift-experiences.jpg',
  accessories: '/images/collections/accessories.jpg',
  workshops: '/images/founder/workspace-2.jpg',
  customisation: '/images/founder/workspace-4.jpg',
};

const collectionBlurbs: Record<string, string> = {
  'diy-kits': 'Beautiful kits for every stitcher',
  'gift-experiences': 'Thoughtful gifts for every occasion',
  accessories: 'Curated tools & handmade add-ons',
  workshops: 'Learn together, stitch together',
  customisation: 'Make it uniquely yours',
};

export const CollectionsNavSection: React.FC<CollectionsNavSectionProps> = ({ items }) => {
  return (
    <Section variant="cream">
      <Container>
        <SectionHeading
          eyebrow="Explore the Universe"
          headline="Bee-Guided Collections"
          subheadline="Choose your entrance into slow living and quiet creativity."
        />

        <div className="flex md:grid md:grid-cols-5 gap-4 overflow-x-auto snap-x snap-mandatory md:overflow-visible pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none">
          {items.map((item, idx) => {
            const targetHref = item.isComingSoon
              ? '/coming-soon'
              : item.handle === 'workshops'
                ? '/workshops'
                : item.handle === 'customisation'
                  ? '/customisation'
                  : `/collections/view/?handle=${encodeURIComponent(item.handle)}`;

            const imageSrc = collectionImages[item.handle] ?? null;
            const blurb = collectionBlurbs[item.handle] || '';
            const isWide = idx === 0;

            return (
              <Link
                key={item.handle}
                href={targetHref}
                className={`group relative shrink-0 w-[70vw] sm:w-[240px] md:w-auto snap-start transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 ${
                  isWide ? 'md:col-span-1' : ''
                }`}
              >
                <DoubleBezel variant="dark" className="h-full min-h-[280px]">
                  <div className="relative min-h-[280px] flex flex-col justify-end p-5">
                    {imageSrc ? (
                      <Image
                        src={imageSrc}
                        alt=""
                        fill
                        className="object-cover opacity-55 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:opacity-70 group-hover:scale-105"
                        sizes="(max-width: 768px) 70vw, 20vw"
                      />
                    ) : (
                      <div
                        className="absolute inset-0 bg-gradient-to-br from-wine-ink via-deep-wine to-wine opacity-90 flex items-center justify-center overflow-hidden"
                        aria-hidden="true"
                      >
                        <svg
                          className="absolute inset-0 w-full h-full opacity-10"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 100 100"
                          preserveAspectRatio="none"
                        >
                          <defs>
                            <pattern id={`stitch-${item.handle}`} width="16" height="16" patternUnits="userSpaceOnUse">
                              <path
                                d="M 0 8 L 16 8 M 8 0 L 8 16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="0.5"
                                strokeDasharray="2 2"
                                className="text-gold"
                              />
                            </pattern>
                          </defs>
                          <rect width="100%" height="100%" fill={`url(#stitch-${item.handle})`} />
                        </svg>
                        <div className="w-14 h-14 rounded-full border border-gold/25 flex items-center justify-center text-gold/40">
                          <span className="font-display text-xl font-light">{item.title.charAt(0)}</span>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-wine-ink/90 via-wine-ink/30 to-transparent" />

                    <div className="relative z-10 text-cream">
                      <h3 className="font-display text-xl font-normal mb-1 group-hover:text-antique-gold transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                        {item.title}
                      </h3>
                      <p className="font-body text-xs font-light text-cream/70 mb-3">{blurb}</p>
                      <div className="flex items-center justify-between">
                        {item.badge || item.isComingSoon ? (
                          <span className="text-[9px] uppercase font-semibold tracking-[0.16em] text-antique-gold bg-gold/15 px-2.5 py-1 rounded-full ring-1 ring-gold/30">
                            {item.badge || 'Coming Soon'}
                          </span>
                        ) : (
                          <span className="text-[11px] uppercase tracking-[0.14em] font-medium text-antique-gold">
                            Explore →
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </DoubleBezel>
              </Link>
            );
          })}
        </div>
      </Container>
    </Section>
  );
};
