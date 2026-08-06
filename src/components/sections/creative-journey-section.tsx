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
          eyebrow="STEP-BY-STEP PROCESS"
          headline="Your Creative Journey"
          subheadline="From unboxing to your framed finished masterpiece."
        />

        <div className="relative max-w-4xl mx-auto">
          {/* Central Connecting Line */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px] bg-gold/30 hidden md:block" />

          <div className="space-y-8 md:space-y-12 relative">
            {steps.map((step, idx) => {
              const isEven = idx % 2 === 0;

              return (
                <div
                  key={step.stepNumber}
                  className={`flex flex-col md:flex-row items-center gap-6 ${
                    isEven ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  {/* Content Box */}
                  <div className={`flex-1 w-full text-center ${isEven ? 'md:text-left' : 'md:text-right'}`}>
                    <div className="bg-white p-6 rounded-xl border border-wine/10 inline-block w-full max-w-md">
                      <span className="font-accent italic text-xs text-gold font-semibold tracking-wider block mb-1">
                        STEP 0{step.stepNumber}
                      </span>
                      <h4 className="font-display text-xl font-medium text-wine mb-1">
                        {step.title}
                      </h4>
                      <p className="font-body text-xs text-wine/70 font-light">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* Step Number Circle */}
                  <div className="w-12 h-12 rounded-full bg-deep-wine text-antique-gold font-display text-lg font-bold flex items-center justify-center border-2 border-gold flex-shrink-0 z-10 shadow-wine-sm">
                    {step.stepNumber}
                  </div>

                  {/* Empty Spacer for alternating layout */}
                  <div className="flex-1 hidden md:block" />
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </Section>
  );
};
