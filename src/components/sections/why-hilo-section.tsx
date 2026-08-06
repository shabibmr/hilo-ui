import React from 'react';
import { Section } from '../common/section';
import { Container } from '../common/container';
import { SectionHeading } from '../common/section-heading';
import { HomepageContent } from '@/lib/data/types';
import { HeartHandshake, Video, Sparkles, Moon, Gift, Clock } from 'lucide-react';

interface WhyHiloSectionProps {
  cards: HomepageContent['whyHiloCards'];
}

const iconMap: Record<string, React.ReactNode> = {
  HeartHandshake: <HeartHandshake className="w-6 h-6 text-gold" />,
  Video: <Video className="w-6 h-6 text-gold" />,
  Sparkles: <Sparkles className="w-6 h-6 text-gold" />,
  Moon: <Moon className="w-6 h-6 text-gold" />,
  Gift: <Gift className="w-6 h-6 text-gold" />,
  Clock: <Clock className="w-6 h-6 text-gold" />,
};

export const WhyHiloSection: React.FC<WhyHiloSectionProps> = ({ cards }) => {
  return (
    <Section variant="sage">
      <Container>
        <SectionHeading
          eyebrow="OUR PHILOSOPHY"
          headline="Beautiful things do not need to be rushed."
          subheadline="Every kit is designed to provide a restful, meditative creative pause."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className="bg-white/80 backdrop-blur-sm p-8 rounded-xl border border-wine/10 hover:border-gold/50 transition-all duration-300 hover:shadow-wine-sm flex flex-col items-start space-y-4"
            >
              <div className="w-12 h-12 rounded-lg bg-wine/5 border border-gold/30 flex items-center justify-center">
                {iconMap[card.icon] || <Sparkles className="w-6 h-6 text-gold" />}
              </div>
              <h3 className="font-display text-xl font-medium text-wine">{card.title}</h3>
              <p className="font-body text-sm text-wine/70 font-light leading-relaxed">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
};
