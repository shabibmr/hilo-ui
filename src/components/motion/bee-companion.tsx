'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface BeeCompanionProps {
  className?: string;
  size?: number;
}

export const BeeCompanion: React.FC<BeeCompanionProps> = ({
  className = '',
  size = 32,
}) => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, x: -10 }}
      animate={{
        opacity: [0, 1, 1, 0.9],
        x: [0, 15, 30, 20, 0],
        y: [0, -8, -4, -12, 0],
        rotate: [0, 4, -3, 2, 0],
      }}
      transition={{
        duration: 4.5,
        repeat: Infinity,
        repeatType: 'mirror',
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={`pointer-events-none z-20 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-antique-gold drop-shadow-[0_2px_8px_rgba(176,141,87,0.4)]"
      >
        {/* Delicate Bee Wings */}
        <ellipse cx="12" cy="11" rx="5" ry="8" transform="rotate(-30 12 11)" stroke="currentColor" strokeWidth="1" opacity="0.6" fill="rgba(248, 245, 239, 0.3)" />
        <ellipse cx="20" cy="11" rx="5" ry="8" transform="rotate(30 20 11)" stroke="currentColor" strokeWidth="1" opacity="0.6" fill="rgba(248, 245, 239, 0.3)" />

        {/* Bee Body */}
        <ellipse cx="16" cy="18" rx="6" ry="9" stroke="currentColor" strokeWidth="1.5" fill="#380B0C" />
        
        {/* Metallic Gold Body Stripes */}
        <path d="M11 16H21" stroke="#B08D57" strokeWidth="1.5" />
        <path d="M12 19H20" stroke="#B08D57" strokeWidth="1.5" />
        
        {/* Head & Antennae */}
        <circle cx="16" cy="11" r="3.5" fill="currentColor" />
        <path d="M14 9C13 7 11 6 10 6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <path d="M18 9C19 7 21 6 22 6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        
        {/* Stinger */}
        <path d="M16 27L15 29H17L16 27Z" fill="currentColor" />
      </svg>
    </motion.div>
  );
};
