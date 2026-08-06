import { animate, stagger, random } from 'animejs';

export const triggerPollenBurst = (x: number, y: number) => {
  // Respect reduced motion settings
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const dotCount = 14;
  const dots: HTMLDivElement[] = [];

  for (let i = 0; i < dotCount; i++) {
    const dot = document.createElement('div');
    dot.className = 'fixed w-2 h-2 rounded-full pointer-events-none z-[9999] shadow-[0_0_8px_#B08D57]';
    dot.style.backgroundColor = i % 2 === 0 ? '#B08D57' : '#E6CA94';
    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;
    document.body.appendChild(dot);
    dots.push(dot);
  }

  animate(dots, {
    translateX: () => random(-70, 70),
    translateY: () => random(-70, 70),
    scale: [random(1.2, 2.2), 0],
    opacity: [1, 0],
    duration: 700,
    ease: 'outQuad',
    delay: stagger(30, { start: 0, from: 'center' }),
    onComplete: () => {
      dots.forEach((dot) => {
        if (dot.parentNode) {
          dot.parentNode.removeChild(dot);
        }
      });
    },
  });
};
