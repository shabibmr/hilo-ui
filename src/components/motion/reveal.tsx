'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { DURATION, EASE_LUXURY } from '@/lib/motion-variants';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export const Reveal: React.FC<RevealProps> = ({
  children,
  delay = 0,
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      variants={{
        hidden: { opacity: 0, y: 48 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: DURATION.slow,
            ease: EASE_LUXURY,
            delay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
