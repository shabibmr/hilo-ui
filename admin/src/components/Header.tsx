'use client';

import React from 'react';
import { Menu, ExternalLink, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export function Header({ onOpenMobileMenu }: HeaderProps) {
  const { isConfigured } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-stone-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center space-x-2 text-xs text-stone-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="hidden sm:inline font-medium text-stone-700">
            {isConfigured ? 'Signed in' : 'Sample studio'}
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <a
          href="/hilo"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-1.5 text-xs font-medium text-[#380b0c] hover:text-[#5a1416] bg-amber-50 hover:bg-amber-100/70 border border-amber-200/60 px-3 py-1.5 rounded-lg transition-colors"
        >
          <span>View Storefront</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </header>
  );
}
