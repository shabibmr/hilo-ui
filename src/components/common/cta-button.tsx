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
  /** Show nested trailing arrow icon (default true when not icon-only children) */
  showArrow?: boolean;
  icon?: React.ReactNode;
}

const ArrowIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-3.5 h-3.5"
    aria-hidden="true"
  >
    <path d="M7 17 17 7M9 7h8v8" />
  </svg>
);

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
  showArrow = true,
  icon,
}) => {
  const baseClasses =
    'group inline-flex items-center justify-center gap-3 font-body tracking-[0.12em] uppercase font-semibold transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] rounded-full active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const sizeClasses = {
    sm: 'pl-4 pr-1.5 py-1.5 text-[10px]',
    default: 'pl-6 pr-2 py-2 text-xs',
    lg: 'pl-7 pr-2 py-2.5 text-sm',
  };

  const iconSizeClasses = {
    sm: 'w-8 h-8',
    default: 'w-9 h-9',
    lg: 'w-10 h-10',
  };

  const variantClasses = {
    'solid-gold':
      'bg-gold text-wine hover:bg-antique-gold shadow-[0_0_32px_-4px_rgba(176,141,87,0.28)]',
    'solid-wine': 'bg-wine text-cream hover:bg-deep-wine',
    'outline-gold':
      'bg-transparent text-gold ring-1 ring-gold/55 hover:bg-gold/10',
    'outline-cream':
      'bg-transparent text-cream ring-1 ring-cream/45 hover:bg-cream/10',
  };

  const iconShellClasses = {
    'solid-gold': 'bg-wine/10',
    'solid-wine': 'bg-white/10',
    'outline-gold': 'bg-gold/12',
    'outline-cream': 'bg-cream/12',
  };

  const combinedClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${fullWidth ? 'w-full' : ''} ${className}`;

  const content = (
    <>
      <span className={showArrow || icon ? '' : 'pr-4'}>{children}</span>
      {(showArrow || icon) && (
        <span
          className={`${iconSizeClasses[size]} rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105 ${iconShellClasses[variant]}`}
        >
          {icon ?? <ArrowIcon />}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={combinedClasses} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={combinedClasses}>
      {content}
    </button>
  );
};
