import React from 'react';

interface SectionProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
  variant?: 'cream' | 'wine' | 'deep-wine' | 'sage';
}

export const Section: React.FC<SectionProps> = ({
  children,
  id,
  className = '',
  variant = 'cream',
}) => {
  const variantClasses = {
    cream: 'bg-cream text-wine',
    wine: 'bg-wine text-cream',
    'deep-wine': 'bg-deep-wine text-cream',
    sage: 'bg-sage/10 text-wine',
  };

  return (
    <section
      id={id}
      className={`py-16 sm:py-24 lg:py-32 relative overflow-hidden ${variantClasses[variant]} ${className}`}
    >
      {children}
    </section>
  );
};
