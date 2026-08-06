'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface ThreadPathProps {
  d: string;
  className?: string;
  strokeColor?: string;
  duration?: number;
}

export const ThreadPath: React.FC<ThreadPathProps> = ({
  d,
  className = '',
  strokeColor = '#B08D57',
  duration = 2.5,
}) => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <svg className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}>
        <path d={d} stroke={strokeColor} strokeWidth="1.5" strokeDasharray="4 4" fill="none" opacity="0.6" />
      </svg>
    );
  }

  return (
    <svg className={`absolute inset-0 w-full h-full pointer-events-none z-10 ${className}`}>
      <motion.path
        d={d}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="4 4"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 0.8 }}
        viewport={{ once: true }}
        transition={{ duration, ease: [0.25, 0.1, 0.25, 1] }}
      />
    </svg>
  );
};
