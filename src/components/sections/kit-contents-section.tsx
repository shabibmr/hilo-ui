import React from 'react';
import Image from 'next/image';
import { Section } from '../common/section';
import { Container } from '../common/container';
import { SectionHeading } from '../common/section-heading';
import { CtaButton } from '../common/cta-button';
import { DoubleBezel } from '../common/double-bezel';
import { HomepageContent } from '@/lib/data/types';

interface KitContentsSectionProps {
  items: HomepageContent['kitContentsItems'];
}

export const KitContentsSection: React.FC<KitContentsSectionProps> = ({ items }) => {
  return (
    <Section variant="cream">
      <Container>
        <SectionHeading
          eyebrow="Unboxing the Experience"
          headline="What's Inside Your Kit"
          subheadline="Everything you need to complete your artwork, beautifully packaged in our signature box."
        />

        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 lg:grid-cols-5 md:overflow-visible scrollbar-thin">
          {items.map((item) => (
            <div
              key={item.id}
              className="shrink-0 w-[180px] sm:w-[200px] md:w-auto snap-start"
            >
              <DoubleBezel className="h-full" coreClassName="bg-white h-full">
                {item.image?.url ? (
                  <div className="relative aspect-square bg-wine/[0.03]">
                    <Image
                      src={item.image.url}
                      alt={item.image.altText}
                      fill
                      className="object-cover"
                      sizes="200px"
                    />
                  </div>
                ) : null}
                <div className="p-4">
                  <h4 className="font-display text-base font-medium text-wine">{item.name}</h4>
                  <p className="font-body text-xs text-wine/55 font-light mt-0.5 leading-snug">
                    {item.description}
                  </p>
                </div>
              </DoubleBezel>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <CtaButton href="/whats-inside" variant="outline-gold">
            View Complete Kit Specifications
          </CtaButton>
        </div>
      </Container>
    </Section>
  );
};
