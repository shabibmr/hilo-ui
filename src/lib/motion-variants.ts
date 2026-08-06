import { Variants } from 'framer-motion';

// Two-Tier Motion System Timing Constants
export const DURATION = {
  // Tier 1: Micro-interactions (Snappy UI feedback)
  microFast: 0.15,
  micro: 0.25,
  microSlow: 0.35,

  // Tier 2: Narrative & Ambient motion (Slow luxury feel)
  slow: 0.8,
  slower: 1.5,
  slowest: 2.5,
} as const;

export const EASE_UI = [0.16, 1, 0.3, 1] as const; // Fast enter, smooth out
export const EASE_ORGANIC = [0.25, 0.1, 0.25, 1] as const; // Organic luxury curve

// Shared Motion Variants
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DURATION.slow, ease: EASE_ORGANIC },
  },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.slow, ease: EASE_ORGANIC },
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

export const floatLoop: Variants = {
  animate: {
    y: [0, -8, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const hoverGoldGlow: Variants = {
  rest: {
    scale: 1,
    boxShadow: '0 4px 20px -4px rgba(56, 11, 12, 0.15)',
  },
  hover: {
    scale: 1.02,
    boxShadow: '0 0 24px 0 rgba(176, 141, 87, 0.35), 0 8px 30px -8px rgba(56, 11, 12, 0.25)',
    transition: { duration: DURATION.micro, ease: EASE_UI },
  },
};
