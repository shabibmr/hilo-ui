'use client';

import React, { useEffect, useRef, useState } from 'react';
import { animate } from 'animejs';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { triggerPollenBurst } from './pollen-burst';

interface AnimeBeeCompanionProps {
  className?: string;
  size?: number;
}

export const AnimeBeeCompanion: React.FC<AnimeBeeCompanionProps> = ({
  className = '',
  size = 40,
}) => {
  const beeContainerRef = useRef<HTMLDivElement>(null);
  const wingLeftRef = useRef<SVGEllipseElement>(null);
  const wingRightRef = useRef<SVGEllipseElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  const [bubbleText, setBubbleText] = useState("Come, let me show you.");
  const [isBubbleVisible, setIsBubbleVisible] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  // Position state for mouse tracking & spring lerp
  const positionRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, angle: 0 });

  useEffect(() => {
    if (prefersReducedMotion || !beeContainerRef.current) return;

    // Set initial position on screen right side
    const initialX = window.innerWidth - 80;
    const initialY = window.innerHeight * 0.45;
    positionRef.current = { x: initialX, y: initialY, targetX: initialX, targetY: initialY, angle: 0 };
    
    if (beeContainerRef.current) {
      beeContainerRef.current.style.transform = `translate3d(${initialX}px, ${initialY}px, 0px)`;
    }

    // 1. High-frequency Wingbeat Animation Loops via Anime.js v4
    const wingLAnim = wingLeftRef.current
      ? animate(wingLeftRef.current, {
          rotateY: [-42, 42],
          scaleY: [0.85, 1.15],
          duration: 65,
          direction: 'alternate',
          loop: true,
          ease: 'linear',
        })
      : null;

    const wingRAnim = wingRightRef.current
      ? animate(wingRightRef.current, {
          rotateY: [42, -42],
          scaleY: [0.85, 1.15],
          duration: 65,
          direction: 'alternate',
          loop: true,
          ease: 'linear',
        })
      : null;

    // 2. Organic Hover Float Loop via Anime.js v4
    const bodyFloatAnim = animate(beeContainerRef.current, {
      translateY: [-8, 10, -4, 0],
      duration: 3600,
      direction: 'alternate',
      loop: true,
      ease: 'inOutSine',
    });

    // 3. Scroll Handler to Update Dynamic Speech Bubble & Target Coordinates
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollRatio = docHeight > 0 ? scrolled / docHeight : 0;

      // Calculate target vertical location based on scroll
      const targetY = window.innerHeight * 0.25 + (window.innerHeight * 0.5 * scrollRatio);
      const targetX = window.innerWidth - 70 - Math.sin(scrollRatio * Math.PI * 4) * 35;

      positionRef.current.targetX = targetX;
      positionRef.current.targetY = targetY;

      // Section Landmark Bubble Text Updates
      if (scrolled < 300) {
        setBubbleText("Come, let me show you.");
      } else if (scrolled < 900) {
        setBubbleText("Choose your entrance into slow creativity.");
      } else if (scrolled < 1600) {
        setBubbleText("Beautiful things take time...");
      } else if (scrolled < 2300) {
        setBubbleText("Find a pattern that calls to your soul.");
      } else if (scrolled < 3000) {
        setBubbleText("Read a quiet letter from our founder.");
      } else if (scrolled < 3800) {
        setBubbleText("Explore every thread & beechwood hoop.");
      } else {
        setBubbleText("A quiet, patient day to you.");
      }
    };

    // 4. Mouse Move Tracking (subtle influence toward cursor)
    const handleMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - positionRef.current.x) * 0.04;
      const dy = (e.clientY - positionRef.current.y) * 0.04;
      positionRef.current.targetX += dx;
      positionRef.current.targetY += dy;
    };

    // 5. Physics Animation Frame Loop for Smooth Lerp & Angle Rotation
    let rafId: number;
    const updatePhysics = () => {
      const pos = positionRef.current;
      
      const dx = pos.targetX - pos.x;
      const dy = pos.targetY - pos.y;
      
      pos.x += dx * 0.08;
      pos.y += dy * 0.08;

      // Calculate travel angle
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        const targetAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        pos.angle += (targetAngle - pos.angle) * 0.1;
      }

      if (beeContainerRef.current) {
        beeContainerRef.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0px) rotate(${pos.angle * 0.15}deg)`;
      }

      rafId = requestAnimationFrame(updatePhysics);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    rafId = requestAnimationFrame(updatePhysics);
    handleScroll();

    return () => {
      wingLAnim?.pause();
      wingRAnim?.pause();
      bodyFloatAnim.pause();
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, [prefersReducedMotion]);

  // Click Interaction: Trigger Pollen Burst & Wiggle
  const handleClick = (e: React.MouseEvent) => {
    triggerPollenBurst(e.clientX, e.clientY);

    if (beeContainerRef.current) {
      animate(beeContainerRef.current, {
        scale: [1, 1.3, 0.9, 1.1, 1],
        rotate: [0, -15, 15, -10, 0],
        duration: 700,
        ease: 'outElastic(1, .5)',
      });
    }
  };

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <div
      ref={beeContainerRef}
      onClick={handleClick}
      className={`fixed top-0 left-0 z-50 cursor-pointer pointer-events-auto select-none ${className}`}
      style={{ willChange: 'transform' }}
    >
      {/* Interactive Speech Bubble */}
      <div
        ref={bubbleRef}
        className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-wine/95 backdrop-blur-md text-cream font-body text-xs px-3.5 py-1.5 rounded-full border border-gold/40 shadow-[0_8px_20px_rgba(0,0,0,0.25)] whitespace-nowrap transition-all duration-500 ease-out ${
          isBubbleVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95'
        }`}
      >
        <span className="font-light tracking-wide">{bubbleText}</span>
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-wine/95" />
      </div>

      {/* Bespoke SVG Bee */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-antique-gold drop-shadow-[0_4px_16px_rgba(176,141,87,0.5)] transition-transform duration-200 hover:scale-110"
      >
        {/* Left & Right Iridescent Wings */}
        <ellipse
          ref={wingLeftRef}
          cx="22"
          cy="22"
          rx="12"
          ry="5"
          fill="#FAF6F0"
          opacity="0.85"
          transform="rotate(-30 22 22)"
          stroke="#B08D57"
          strokeWidth="0.8"
        />
        <ellipse
          ref={wingRightRef}
          cx="42"
          cy="22"
          rx="12"
          ry="5"
          fill="#FAF6F0"
          opacity="0.85"
          transform="rotate(30 42 22)"
          stroke="#B08D57"
          strokeWidth="0.8"
        />

        {/* Torso & Metallic Gold Body */}
        <ellipse cx="32" cy="32" rx="10" ry="16" fill="#B08D57" stroke="#380B0C" strokeWidth="1.5" />
        
        {/* Wine Dark Body Stripes */}
        <path d="M 23 24 Q 32 28 41 24" stroke="#380B0C" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M 21 32 Q 32 36 43 32" stroke="#380B0C" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M 23 40 Q 32 44 41 40" stroke="#380B0C" strokeWidth="2.5" fill="none" strokeLinecap="round" />

        {/* Head & Antennae */}
        <circle cx="32" cy="17" r="5" fill="#380B0C" />
        <path d="M 29 13 C 27 10 24 9 22 9" stroke="#B08D57" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M 35 13 C 37 10 40 9 42 9" stroke="#B08D57" strokeWidth="1.2" strokeLinecap="round" />

        {/* Stinger */}
        <path d="M 32 48 L 30 52 H 34 L 32 48 Z" fill="#380B0C" />
      </svg>
    </div>
  );
};
