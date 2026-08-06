import { Variants } from 'framer-motion';

// Two-Tier Motion System Timing Constants
export const DURATION = {
  // Tier 1: Micro-interactions (Snappy UI feedback)
  microFast: 0.15,
  micro: 0.25,
  microSlow: 0.35,

  // Tier 2: Narrative & Ambient motion (Slow luxury feel)
  slow: 0.85,
  slower: 1.5,
  slowest: 2.5,
} as const;

/** Fast enter, smooth out — UI micro */
export const EASE_UI = [0.32, 0.72, 0, 1] as const;
/** Organic luxury curve — narrative */
export const EASE_ORGANIC = [0.25, 0.1, 0.25, 1] as const;
/** Primary luxury easing (matches CSS --ease-luxury) */
export const EASE_LUXURY = [0.32, 0.72, 0, 1] as const;

// Shared Motion Variants
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DURATION.slow, ease: EASE_LUXURY },
  },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 48 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.slow, ease: EASE_LUXURY },
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
      ease: EASE_ORGANIC,
    },
  },
};

export const hoverGoldGlow: Variants = {
  rest: {
    scale: 1,
    boxShadow: '0 16px 40px -24px rgba(56, 11, 12, 0.1)',
  },
  hover: {
    scale: 1.02,
    boxShadow:
      '0 0 32px -4px rgba(176, 141, 87, 0.28), 0 28px 64px -32px rgba(56, 11, 12, 0.14)',
    transition: { duration: DURATION.micro, ease: EASE_UI },
  },
};
