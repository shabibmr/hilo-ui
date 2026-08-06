'use client';

import React, { useState } from 'react';
import { Section } from '../common/section';
import { Container } from '../common/container';

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
    <Section variant="deep-wine" className="py-20 text-center border-t border-gold/20">
      <Container size="sm">
        <div className="space-y-4">
          <span className="text-eyebrow text-xs tracking-[0.25em] text-antique-gold font-accent">
            — THE QUIET LETTER —
          </span>

          <h2 className="font-display text-h2 text-cream font-normal leading-tight">
            Receive gentle thoughts on slow creative living.
          </h2>

          <p className="font-body text-sm sm:text-base text-cream/70 font-light max-w-lg mx-auto">
            No spam or noisy promotions. Just seasonal embroidery patterns, tea pairings, and early access to handcrafted gift releases.
          </p>

          {subscribed ? (
            <div className="p-4 bg-wine/60 border border-gold/30 rounded-lg text-antique-gold font-body text-sm max-w-md mx-auto animate-fadeIn">
              ✨ Thank you for subscribing. Your quiet letter will arrive soon.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto pt-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email..."
                required
                className="flex-1 bg-wine/50 border border-gold/30 rounded-md px-4 py-3 text-sm text-cream placeholder-cream/40 focus:outline-none focus:border-gold"
              />
              <button
                type="submit"
                className="bg-gold text-wine hover:bg-antique-gold px-6 py-3 rounded-md font-body text-xs uppercase tracking-wider font-semibold shadow-gold-glow transition-colors cursor-pointer"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>
      </Container>
    </Section>
  );
};
