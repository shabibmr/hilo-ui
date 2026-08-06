import React from 'react';
import { Section } from '../common/section';
import { Container } from '../common/container';
import { SectionHeading } from '../common/section-heading';
import { HomepageContent } from '@/lib/data/types';

interface CreativeJourneySectionProps {
  steps: HomepageContent['creativeJourneySteps'];
}

export const CreativeJourneySection: React.FC<CreativeJourneySectionProps> = ({ steps }) => {
  return (
    <Section variant="sage">
      <Container>
        <SectionHeading
          eyebrow="From Box to Beauty"
          headline="Your Creative Journey"
          subheadline="Seven gentle steps from unboxing to sharing your finished artwork."
        />

        <ol className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-6 lg:gap-3">
          {/* Desktop hairline path */}
          <div
            className="hidden lg:block absolute top-[2.1rem] left-[6%] right-[6%] h-px bg-gradient-to-r from-transparent via-gold/45 to-transparent pointer-events-none"
            aria-hidden="true"
          />

          {steps.map((step) => (
            <li key={step.stepNumber} className="relative z-10 text-center px-2">
              <div className="w-11 h-11 mx-auto mb-3 rounded-full bg-cream-warm font-display text-sm text-wine flex items-center justify-center ring-1 ring-gold/35 shadow-[0_0_0_6px_rgba(56,11,12,0.03)]">
                {step.stepNumber}
              </div>
              <h4 className="font-display text-base font-medium text-wine mb-1">{step.title}</h4>
              <p className="font-body text-xs text-wine/60 font-light leading-relaxed">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
};
