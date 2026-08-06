import React from 'react';
import { EyebrowPill } from './eyebrow-pill';

interface SectionHeadingProps {
  eyebrow?: string;
  headline: string;
  subheadline?: string;
  centered?: boolean;
  theme?: 'light' | 'dark';
  className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  eyebrow,
  headline,
  subheadline,
  centered = true,
  theme = 'light',
  className = '',
}) => {
  const isDark = theme === 'dark';

  return (
    <div
      className={`flex flex-col ${centered ? 'items-center text-center' : 'items-start text-left'} mb-12 sm:mb-16 ${className}`}
    >
      {eyebrow && (
        <EyebrowPill theme={isDark ? 'dark' : 'light'} className="mb-4">
          {eyebrow}
        </EyebrowPill>
      )}

      <h2
        className={`font-display text-h2 font-normal leading-tight max-w-3xl ${isDark ? 'text-cream' : 'text-wine'}`}
      >
        {headline}
      </h2>

      <div className="flex items-center gap-3 my-4" aria-hidden="true">
        <div className={`h-px w-8 ${isDark ? 'bg-antique-gold/40' : 'bg-gold/40'}`} />
        <div className={`w-1.5 h-1.5 rotate-45 ${isDark ? 'bg-antique-gold' : 'bg-gold'}`} />
        <div className={`h-px w-8 ${isDark ? 'bg-antique-gold/40' : 'bg-gold/40'}`} />
      </div>

      {subheadline && (
        <p
          className={`font-body text-base sm:text-lg max-w-2xl font-light leading-relaxed ${isDark ? 'text-cream/75' : 'text-wine/75'}`}
        >
          {subheadline}
        </p>
      )}
    </div>
  );
};
