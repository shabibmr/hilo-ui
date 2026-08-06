import React from 'react';
import Image from 'next/image';
import { Section } from '../common/section';
import { Container } from '../common/container';
import { CtaButton } from '../common/cta-button';
import { HomepageContent } from '@/lib/data/types';

interface FounderTeaserSectionProps {
  content: HomepageContent['founderTeaser'];
}

export const FounderTeaserSection: React.FC<FounderTeaserSectionProps> = ({ content }) => {
  return (
    <Section variant="wine">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Story Content: first in DOM (mobile reads text before imagery), right column on desktop */}
          <div className="space-y-6 order-1 lg:order-2">
            <span className="text-eyebrow text-xs tracking-[0.25em] text-antique-gold font-accent">
              — {content.eyebrow} —
            </span>

            <h2 className="font-display text-h2 text-cream font-normal leading-tight">
              {content.headline}
            </h2>

            <p className="font-body text-base sm:text-lg text-cream/80 font-light leading-relaxed">
              {content.bioSnippet}
            </p>

            <blockquote className="border-l-2 border-gold pl-4 font-accent italic text-lg text-antique-gold font-normal py-1">
              &ldquo;Every kit is designed for beginners, busy people, curious minds, and gift givers.&rdquo;
            </blockquote>

            <div className="pt-4">
              <CtaButton href="/founder-story" variant="solid-gold" size="lg">
                {content.ctaText}
              </CtaButton>
            </div>
          </div>

          {/* Portrait + accent grid: second in DOM on mobile, left column on desktop */}
          <div className="relative order-2 lg:order-1 space-y-4">
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-gold/30 shadow-wine-lg bg-deep-wine">
              {content.image?.url ? (
                <Image
                  src={content.image.url}
                  alt={content.image.altText}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-deep-wine flex items-center justify-center font-display text-2xl text-antique-gold/40">
                  NAIMA — FOUNDER
                </div>
              )}

              {/* Decorative Gold Frame Accent */}
              <div className="absolute -bottom-4 -right-4 w-full h-full rounded-2xl border border-gold/20 -z-10 hidden sm:block" />
            </div>

            {content.galleryImages && content.galleryImages.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {content.galleryImages.slice(0, 4).map((img) => (
                  <div
                    key={img.url}
                    className="relative aspect-square rounded-xl overflow-hidden border border-gold/20"
                  >
                    <Image src={img.url} alt={img.altText} fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
};
