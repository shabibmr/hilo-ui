'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { DURATION, EASE_UI } from '@/lib/motion-variants';

interface FlowerBloomProps {
  active: boolean;
  size?: number;
  className?: string;
}

const PETAL_COUNT = 6;
const RADIUS = 15;

const petals = Array.from({ length: PETAL_COUNT }, (_, i) => {
  const theta = (i * 2 * Math.PI) / PETAL_COUNT;
  return { cx: 32 + RADIUS * Math.cos(theta), cy: 32 + RADIUS * Math.sin(theta) };
});

/**
 * Signature "flower bloom" hover motif: petals scale outward from the icon
 * center in a staggered radial pattern. Triggered by the `active` prop
 * (parent controls hover/focus/in-view state); skipped for reduced motion.
 */
export const FlowerBloom: React.FC<FlowerBloomProps> = ({ active, size = 80, className = '' }) => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) return null;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={`pointer-events-none absolute inset-0 ${className}`}
      aria-hidden="true"
    >
      {petals.map((petal, i) => (
        <motion.circle
          key={i}
          cx={petal.cx}
          cy={petal.cy}
          r="3.5"
          fill="var(--color-gold)"
          initial={false}
          animate={active ? 'bloom' : 'rest'}
          variants={{
            rest: { scale: 0, opacity: 0 },
            bloom: {
              scale: 1,
              opacity: 0.5,
              transition: { duration: DURATION.micro, delay: i * 0.045, ease: EASE_UI },
            },
          }}
          style={{ transformOrigin: `${petal.cx}px ${petal.cy}px` }}
        />
      ))}
      <motion.circle
        cx="32"
        cy="32"
        r="4"
        fill="var(--color-antique-gold)"
        initial={false}
        animate={active ? 'bloom' : 'rest'}
        variants={{
          rest: { scale: 0, opacity: 0 },
          bloom: { scale: 1, opacity: 0.9, transition: { duration: DURATION.micro, ease: EASE_UI } },
        }}
        style={{ transformOrigin: '32px 32px' }}
      />
    </svg>
  );
};
