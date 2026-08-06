'use client';

import { useReducedMotion as useFramerReducedMotion } from 'framer-motion';

export function useReducedMotion(): boolean {
  const prefersReduced = useFramerReducedMotion();
  return Boolean(prefersReduced);
}
