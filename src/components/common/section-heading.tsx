import React from 'react';

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
    <div className={`flex flex-col ${centered ? 'items-center text-center' : 'items-start text-left'} mb-12 sm:mb-16 ${className}`}>
      {eyebrow && (
        <span className={`text-eyebrow text-xs sm:text-sm tracking-[0.2em] font-accent mb-3 ${isDark ? 'text-antique-gold' : 'text-gold'}`}>
          — {eyebrow} —
        </span>
      )}
      
      <h2 className={`font-display text-h2 font-normal leading-tight max-w-3xl ${isDark ? 'text-cream' : 'text-wine'}`}>
        {headline}
      </h2>

      {/* Gold Flourish Line */}
      <div className="flex items-center gap-3 my-4">
        <div className={`h-[1px] w-8 ${isDark ? 'bg-antique-gold/40' : 'bg-gold/40'}`} />
        <div className={`w-1.5 h-1.5 rotate-45 ${isDark ? 'bg-antique-gold' : 'bg-gold'}`} />
        <div className={`h-[1px] w-8 ${isDark ? 'bg-antique-gold/40' : 'bg-gold/40'}`} />
      </div>

      {subheadline && (
        <p className={`font-body text-base sm:text-lg max-w-2xl font-light leading-relaxed ${isDark ? 'text-cream/80' : 'text-wine/80'}`}>
          {subheadline}
        </p>
      )}
    </div>
  );
};
