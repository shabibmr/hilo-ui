'use client';

import React from 'react';
import Link from 'next/link';
import { HoopLogo } from '../common/hoop-logo';
import { useDrawer } from '@/hooks/use-drawer';
import { X } from 'lucide-react';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  links: { label: string; href: string }[];
}

export const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose, links }) => {
  const panelRef = useDrawer<HTMLDivElement>(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Main menu"
      className="fixed inset-0 z-50 md:hidden flex flex-col bg-deep-wine text-cream animate-fadeIn"
    >
      {/* Drawer Header */}
      <div className="flex items-center justify-between p-6 border-b border-gold/20">
        <HoopLogo size={32} />
        <button
          onClick={onClose}
          className="p-2 text-cream hover:text-gold transition-colors"
          aria-label="Close menu"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 flex flex-col justify-center px-8 space-y-6 text-center">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            className="font-display text-2xl font-normal text-cream hover:text-gold transition-colors tracking-wide"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Drawer Footer */}
      <div className="p-8 text-center border-t border-gold/20">
        <p className="font-accent italic text-sm text-antique-gold">
          &ldquo;Beautiful things do not need to be rushed.&rdquo;
        </p>
      </div>
    </div>
  );
};
