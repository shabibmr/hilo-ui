'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { HoopLogo } from '../common/hoop-logo';
import { useDrawer } from '@/hooks/use-drawer';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  links: { label: string; href: string }[];
}

export const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose, links }) => {
  const panelRef = useDrawer<HTMLDivElement>(isOpen, onClose);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Main menu"
      className={`fixed inset-0 z-50 md:hidden flex flex-col bg-wine-ink/90 backdrop-blur-3xl text-cream transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        isOpen
          ? 'opacity-100 visible pointer-events-auto'
          : 'opacity-0 invisible pointer-events-none'
      }`}
    >
      <div className="flex items-center justify-between p-6">
        <HoopLogo size={32} />
        <button
          onClick={onClose}
          className="relative w-11 h-11 rounded-full flex items-center justify-center text-cream hover:text-gold hover:bg-gold/10 transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
          aria-label="Close menu"
        >
          {/* Morph X */}
          <span className="absolute w-4 h-px bg-current rotate-45" />
          <span className="absolute w-4 h-px bg-current -rotate-45" />
        </button>
      </div>

      <nav className="flex-1 flex flex-col justify-center px-8 space-y-1 text-center">
        {links.map((link, idx) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            className={`font-display text-2xl sm:text-3xl font-normal text-cream hover:text-antique-gold transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] tracking-wide py-2 ${
              isOpen ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
            }`}
            style={{
              transitionDelay: isOpen ? `${80 + idx * 60}ms` : '0ms',
            }}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div
        className={`p-8 text-center transition-opacity duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ transitionDelay: isOpen ? '400ms' : '0ms' }}
      >
        <p className="font-accent italic text-base text-antique-gold">
          &ldquo;Beautiful things do not need to be rushed.&rdquo;
        </p>
      </div>
    </div>
  );
};
