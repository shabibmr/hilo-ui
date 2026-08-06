import React from 'react';

interface DoubleBezelProps {
  children: React.ReactNode;
  className?: string;
  coreClassName?: string;
  variant?: 'cream' | 'dark';
}

export const DoubleBezel: React.FC<DoubleBezelProps> = ({
  children,
  className = '',
  coreClassName = '',
  variant = 'cream',
}) => {
  const shell =
    variant === 'dark'
      ? 'bg-white/[0.04] ring-1 ring-white/10'
      : 'bg-wine/[0.04] ring-1 ring-wine/5';

  const core =
    variant === 'dark'
      ? 'bg-deep-wine shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]'
      : 'bg-cream-warm shadow-[inset_0_1px_1px_rgba(255,255,255,0.65)]';

  return (
    <div className={`p-1.5 rounded-[2rem] ${shell} ${className}`}>
      <div
        className={`rounded-[calc(2rem-0.375rem)] overflow-hidden h-full ${core} ${coreClassName}`}
      >
        {children}
      </div>
    </div>
  );
};
