import React from 'react';
import Image from 'next/image';
import { Section } from '../common/section';
import { Container } from '../common/container';
import { CtaButton } from '../common/cta-button';
import { EyebrowPill } from '../common/eyebrow-pill';
import { DoubleBezel } from '../common/double-bezel';
import { HomepageContent } from '@/lib/data/types';

interface FounderTeaserSectionProps {
  content: HomepageContent['founderTeaser'];
}

export const FounderTeaserSection: React.FC<FounderTeaserSectionProps> = ({ content }) => {
  return (
    <Section variant="wine">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-6 order-1 lg:order-2">
            <EyebrowPill theme="dark">{content.eyebrow}</EyebrowPill>

            <h2 className="font-display text-h2 text-cream font-normal leading-tight">
              {content.headline}
            </h2>

            <p className="font-body text-base sm:text-lg text-cream/75 font-light leading-relaxed max-w-md">
              {content.bioSnippet}
            </p>

            <blockquote className="border-l-2 border-gold pl-4 font-accent italic text-xl text-antique-gold font-normal py-1 leading-snug">
              &ldquo;Every kit is designed for beginners, busy people, curious minds, and gift
              givers.&rdquo;
            </blockquote>

            <div className="pt-2">
              <CtaButton href="/founder-story" variant="solid-gold" size="lg">
                {content.ctaText}
              </CtaButton>
            </div>
          </div>

          <div className="relative order-2 lg:order-1 space-y-3">
            <DoubleBezel variant="dark" className="shadow-wine-lg">
              <div className="relative aspect-[4/5]">
                {content.image?.url ? (
                  <Image
                    src={content.image.url}
                    alt={content.image.altText}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                ) : (
                  <div className="w-full h-full bg-deep-wine flex items-center justify-center font-display text-2xl text-antique-gold/40">
                    NAIMA — FOUNDER
                  </div>
                )}
              </div>
            </DoubleBezel>

            {content.galleryImages && content.galleryImages.length > 0 && (
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {content.galleryImages.slice(0, 4).map((img, i) => (
                  <DoubleBezel
                    key={img.url}
                    variant="dark"
                    className={`!rounded-[1rem] ${
                      i % 2 === 0
                        ? 'md:-rotate-2'
                        : 'md:rotate-[1.5deg] md:translate-y-1'
                    }`}
                    coreClassName="!rounded-[calc(1rem-0.25rem)]"
                  >
                    <div className="relative aspect-square">
                      <Image
                        src={img.url}
                        alt={img.altText}
                        fill
                        className="object-cover"
                        sizes="15vw"
                      />
                    </div>
                  </DoubleBezel>
                ))}
              </div>
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
};
