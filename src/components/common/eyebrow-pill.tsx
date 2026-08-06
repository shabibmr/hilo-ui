import React from 'react';

interface EyebrowPillProps {
  children: React.ReactNode;
  theme?: 'light' | 'dark';
  className?: string;
}

export const EyebrowPill: React.FC<EyebrowPillProps> = ({
  children,
  theme = 'light',
  className = '',
}) => {
  const themeClasses =
    theme === 'dark'
      ? 'text-antique-gold bg-antique-gold/10 ring-1 ring-antique-gold/30'
      : 'text-gold bg-gold/[0.08] ring-1 ring-gold/25';

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] font-body ${themeClasses} ${className}`}
    >
      {children}
    </span>
  );
};
