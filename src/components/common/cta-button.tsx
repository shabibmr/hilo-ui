import React from 'react';
import Link from 'next/link';

interface CtaButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: 'solid-gold' | 'solid-wine' | 'outline-gold' | 'outline-cream';
  size?: 'default' | 'lg' | 'sm';
  fullWidth?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export const CtaButton: React.FC<CtaButtonProps> = ({
  children,
  href,
  onClick,
  variant = 'solid-gold',
  size = 'default',
  fullWidth = false,
  className = '',
  type = 'button',
  disabled = false,
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-body tracking-wider text-sm uppercase transition-all duration-300 rounded-md shadow-wine-sm hover:shadow-gold-glow active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const sizeClasses = {
    sm: 'px-5 py-2.5 text-xs',
    default: 'px-7 py-3.5 text-sm font-medium',
    lg: 'px-9 py-4 text-base font-medium',
  };

  // WCAG Compliant Variants:
  // solid-gold: Gold background MUST use Wine text (#380B0C) for AAA contrast compliance
  const variantClasses = {
    'solid-gold': 'bg-gold text-wine hover:bg-antique-gold font-semibold shadow-gold-glow',
    'solid-wine': 'bg-wine text-cream hover:bg-deep-wine font-medium',
    'outline-gold': 'border border-gold text-gold hover:bg-gold/10 font-medium',
    'outline-cream': 'border border-cream/80 text-cream hover:bg-cream/10 font-medium',
  };

  const combinedClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${fullWidth ? 'w-full' : ''} ${className}`;

  if (href) {
    return (
      <Link href={href} className={combinedClasses}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={combinedClasses}>
      {children}
    </button>
  );
};
