'use client';

import React, { useState } from 'react';
import { Section } from '../common/section';
import { Container } from '../common/container';
import { EyebrowPill } from '../common/eyebrow-pill';
import { DoubleBezel } from '../common/double-bezel';
import { CtaButton } from '../common/cta-button';

export const NewsletterSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
    }
  };

  return (
    <Section
      variant="deep-wine"
      className="!bg-[radial-gradient(ellipse_at_50%_0%,#4a1214_0%,var(--color-deep-wine)_55%,#1F0506_100%)]"
    >
      <Container size="sm">
        <div className="text-center space-y-5">
          <EyebrowPill theme="dark">The Quiet Letter</EyebrowPill>

          <h2 className="font-display text-h2 text-cream font-normal leading-tight">
            Receive gentle thoughts on slow creative living.
          </h2>

          <div className="flex items-center justify-center gap-3" aria-hidden="true">
            <div className="h-px w-8 bg-antique-gold/40" />
            <div className="w-1.5 h-1.5 rotate-45 bg-antique-gold" />
            <div className="h-px w-8 bg-antique-gold/40" />
          </div>

          <p className="font-body text-sm sm:text-base text-cream/70 font-light max-w-lg mx-auto leading-relaxed">
            No spam or noisy promotions. Just seasonal embroidery patterns, tea pairings, and early
            access to handcrafted gift releases.
          </p>

          {subscribed ? (
            <p className="font-accent italic text-lg text-antique-gold pt-2">
              Thank you for subscribing. Your quiet letter will arrive soon.
            </p>
          ) : (
            <div className="max-w-md mx-auto pt-2">
              <DoubleBezel variant="dark">
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col sm:flex-row gap-2 p-2 sm:p-1.5 sm:pl-2 items-stretch sm:items-center"
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email…"
                    required
                    className="flex-1 bg-transparent rounded-full px-4 py-3 text-sm text-cream placeholder-cream/40 font-light ring-1 ring-gold/25 focus:outline-none focus:ring-gold/55 transition-shadow duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  />
                  <CtaButton type="submit" variant="solid-gold" size="default" showArrow>
                    Subscribe
                  </CtaButton>
                </form>
              </DoubleBezel>
            </div>
          )}
        </div>
      </Container>
    </Section>
  );
};
