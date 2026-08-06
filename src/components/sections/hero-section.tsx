'use client';

import React from 'react';
import Image from 'next/image';
import { Container } from '../common/container';
import { CtaButton } from '../common/cta-button';
import { EyebrowPill } from '../common/eyebrow-pill';
import { DoubleBezel } from '../common/double-bezel';
import { BeeCompanion } from '../motion/bee-companion';
import { motion } from 'framer-motion';
import { HomepageContent } from '@/lib/data/types';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { DURATION, EASE_LUXURY, EASE_ORGANIC } from '@/lib/motion-variants';

interface HeroSectionProps {
  content: HomepageContent['hero'];
}

export const HeroSection: React.FC<HeroSectionProps> = ({ content }) => {
  const prefersReducedMotion = useReducedMotion();

  const fade = (delay = 0) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 28 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: DURATION.slow, delay, ease: EASE_LUXURY },
        };

  const heroImage = content.backgroundImage?.url || '/hilo/images/hero/hero-fairy-moon.jpg';
  const heroAlt =
    content.backgroundImage?.altText || 'Fairy stitching on crescent moon atmosphere';

  return (
    <section className="relative min-h-[100dvh] flex items-center bg-deep-wine text-cream overflow-hidden pt-8 pb-16 sm:pt-12 sm:pb-20 -mt-[4.5rem]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,_#4a1214_0%,_var(--color-deep-wine)_45%,_#1F0506_100%)] z-0" />

      <div
        className="absolute w-[min(520px,70vw)] h-[min(520px,70vw)] rounded-full border border-gold/10 top-1/2 left-[58%] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0"
        aria-hidden="true"
      />
      <div
        className="absolute w-[min(720px,90vw)] h-[min(720px,90vw)] rounded-full border border-gold/5 top-1/2 left-[58%] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0"
        aria-hidden="true"
      />

      {!prefersReducedMotion && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-gold/40 rounded-full"
              style={{
                top: `${(i * 17) % 100}%`,
                left: `${(i * 23) % 100}%`,
              }}
              animate={{
                y: [0, -18, 0],
                opacity: [0.25, 0.7, 0.25],
              }}
              transition={{
                duration: 3.5 + (i % 4) * 0.5,
                repeat: Infinity,
                ease: EASE_ORGANIC,
                delay: i * 0.28,
              }}
            />
          ))}
        </div>
      )}

      <Container className="relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div className="space-y-6 max-w-xl">
            <motion.div {...fade(0)}>
              <EyebrowPill theme="dark">{content.eyebrow}</EyebrowPill>
            </motion.div>

            <motion.h1
              {...fade(0.12)}
              className="font-display text-h1 text-cream font-normal leading-[1.08] tracking-tight"
            >
              {content.headline}
            </motion.h1>

            <motion.p
              {...fade(0.22)}
              className="font-body text-base sm:text-lg text-cream/75 font-light max-w-md leading-relaxed"
            >
              {content.subheadline}
            </motion.p>

            <div className="relative h-10 flex items-center">
              <BeeCompanion size={32} />
            </div>

            <motion.div
              {...fade(0.32)}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-1"
            >
              <CtaButton href={content.primaryCtaLink} variant="solid-gold" size="lg">
                {content.primaryCtaText}
              </CtaButton>
              <CtaButton href={content.secondaryCtaLink} variant="outline-cream" size="lg">
                {content.secondaryCtaText}
              </CtaButton>
            </motion.div>
          </div>

          <motion.div
            {...fade(0.2)}
            className="relative md:-rotate-[1.5deg] max-w-lg mx-auto w-full"
          >
            <DoubleBezel variant="dark" className="shadow-wine-lg">
              <div className="relative aspect-[4/5] max-h-[min(72vh,640px)]">
                <Image
                  src={heroImage}
                  alt={heroAlt}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-wine-ink/55 backdrop-blur-xl ring-1 ring-gold/20 px-4 py-3">
                  <p className="font-accent italic text-sm sm:text-base text-antique-gold">
                    A quieter hour. A golden thread. A small act of beauty.
                  </p>
                </div>
              </div>
            </DoubleBezel>
          </motion.div>
        </div>
      </Container>
    </section>
  );
};
