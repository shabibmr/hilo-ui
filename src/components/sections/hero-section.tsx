'use client';

import React from 'react';
import { Container } from '../common/container';
import { CtaButton } from '../common/cta-button';
import { BeeCompanion } from '../motion/bee-companion';
import { motion } from 'framer-motion';
import { HomepageContent } from '@/lib/data/types';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface HeroSectionProps {
  content: HomepageContent['hero'];
}

export const HeroSection: React.FC<HeroSectionProps> = ({ content }) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative min-h-[90vh] sm:min-h-screen flex items-center justify-center bg-deep-wine text-cream overflow-hidden pt-28 pb-16">
      {/* Dark Ambient Gradient & Night Sky Atmosphere Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-wine via-deep-wine to-[#1F0506] z-0" />

      {/* Decorative Golden Moon Ring Accent */}
      <div className={`absolute w-[600px] h-[600px] rounded-full border border-gold/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0 ${prefersReducedMotion ? '' : 'animate-pulse'}`} />
      <div className="absolute w-[800px] h-[800px] rounded-full border border-gold/5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0" />

      {/* Floating Particles — ambient only, skipped entirely for reduced motion */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-gold/40 rounded-full"
              style={{
                top: `${(i * 17) % 100}%`,
                left: `${(i * 23) % 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.2, 0.7, 0.2],
              }}
              transition={{
                duration: 3 + (i % 4),
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.3,
              }}
            />
          ))}
        </div>
      )}

      <Container className="relative z-10 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Eyebrow */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.8 }}
            className="flex items-center justify-center gap-3 text-antique-gold font-accent italic text-sm tracking-[0.25em] uppercase"
          >
            <span>— {content.eyebrow} —</span>
          </motion.div>

          {/* Headline H1 */}
          <motion.h1
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 1, delay: prefersReducedMotion ? 0 : 0.2 }}
            className="font-display text-h1 text-cream font-normal leading-[1.1] tracking-tight"
          >
            {content.headline}
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 1, delay: prefersReducedMotion ? 0 : 0.4 }}
            className="font-body text-base sm:text-lg text-cream/80 font-light max-w-xl mx-auto leading-relaxed"
          >
            {content.subheadline}
          </motion.p>

          {/* Bee Companion Floating Entrance */}
          <div className="relative h-12 my-2 flex justify-center items-center">
            <BeeCompanion size={36} />
          </div>

          {/* CTA Hierarchy: Dominant Primary + Subordinate Secondary */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 1, delay: prefersReducedMotion ? 0 : 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            {/* Dominant Primary: Gold Fill with Wine Text for AAA Contrast */}
            <CtaButton href={content.primaryCtaLink} variant="solid-gold" size="lg">
              {content.primaryCtaText}
            </CtaButton>

            {/* Subordinate Secondary: Outline */}
            <CtaButton href={content.secondaryCtaLink} variant="outline-gold" size="lg">
              {content.secondaryCtaText}
            </CtaButton>
          </motion.div>
        </div>
      </Container>
    </section>
  );
};
