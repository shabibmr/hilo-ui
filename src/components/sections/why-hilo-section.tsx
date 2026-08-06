import React from 'react';
import { Section } from '../common/section';
import { Container } from '../common/container';
import { SectionHeading } from '../common/section-heading';
import { DoubleBezel } from '../common/double-bezel';
import { HomepageContent } from '@/lib/data/types';
import { HeartHandshake, Video, Sparkles, Moon, Gift, Clock } from 'lucide-react';

interface WhyHiloSectionProps {
  cards: HomepageContent['whyHiloCards'];
}

const iconMap: Record<string, React.ReactNode> = {
  HeartHandshake: <HeartHandshake className="w-5 h-5" strokeWidth={1.15} />,
  Video: <Video className="w-5 h-5" strokeWidth={1.15} />,
  Sparkles: <Sparkles className="w-5 h-5" strokeWidth={1.15} />,
  Moon: <Moon className="w-5 h-5" strokeWidth={1.15} />,
  Gift: <Gift className="w-5 h-5" strokeWidth={1.15} />,
  Clock: <Clock className="w-5 h-5" strokeWidth={1.15} />,
};

export const WhyHiloSection: React.FC<WhyHiloSectionProps> = ({ cards }) => {
  const [feature, ...rest] = cards;

  return (
    <Section variant="sage">
      <Container>
        <SectionHeading
          eyebrow="Our Philosophy"
          headline="Beautiful things do not need to be rushed."
          subheadline="Every kit is designed to provide a restful, meditative creative pause."
        />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5 md:auto-rows-fr">
          {/* Large philosophy feature cell */}
          {feature && (
            <div className="md:col-span-8 md:row-span-2">
              <DoubleBezel className="h-full min-h-[280px]" coreClassName="h-full">
                <div className="p-8 sm:p-10 h-full flex flex-col justify-between gap-6 bg-[radial-gradient(ellipse_at_90%_10%,rgba(176,141,87,0.12),transparent_50%)]">
                  <div className="w-11 h-11 rounded-full bg-wine/[0.04] ring-1 ring-gold/30 flex items-center justify-center text-gold">
                    {iconMap[feature.icon] || <Sparkles className="w-5 h-5" strokeWidth={1.15} />}
                  </div>
                  <div>
                    <h3 className="font-display text-2xl sm:text-3xl font-normal text-wine leading-snug max-w-[16ch]">
                      A quieter ritual for modern evenings.
                    </h3>
                    <p className="font-body text-sm sm:text-base text-wine/70 font-light leading-relaxed mt-3 max-w-md">
                      HILO ARTE is not a craft supply shop. It is a slow-living embroidery
                      experience — premium materials, guided lessons, and the permission to create
                      without hurry. {feature.description}
                    </p>
                  </div>
                  <span className="text-[11px] uppercase tracking-[0.14em] font-medium text-gold">
                    Begin the journey →
                  </span>
                </div>
              </DoubleBezel>
            </div>
          )}

          {rest.map((card, idx) => (
            <div key={idx} className="md:col-span-4">
              <DoubleBezel className="h-full" coreClassName="h-full bg-white">
                <div className="p-6 sm:p-7 h-full flex flex-col gap-3">
                  <div className="w-11 h-11 rounded-full bg-wine/[0.04] ring-1 ring-gold/30 flex items-center justify-center text-gold">
                    {iconMap[card.icon] || <Sparkles className="w-5 h-5" strokeWidth={1.15} />}
                  </div>
                  <h3 className="font-display text-xl font-medium text-wine">{card.title}</h3>
                  <p className="font-body text-sm text-wine/65 font-light leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </DoubleBezel>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
};
