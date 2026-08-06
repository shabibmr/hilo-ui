'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useScrollHeader } from '@/hooks/use-scroll-header';
import { HoopLogo } from '../common/hoop-logo';
import { useCartStore } from '@/lib/cart/cart-store';
import { ShoppingBag } from 'lucide-react';
import { MobileNav } from './mobile-nav';
import { PromoBar } from './promo-bar';

interface HeaderProps {
  variant?: 'overlay' | 'solid';
  showPromoBar?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  variant = 'overlay',
  showPromoBar = true,
}) => {
  const isScrolled = useScrollHeader(24);
  const { cart, toggleCart } = useCartStore();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const totalCartCount = cart?.totalQuantity || 0;

  const navLinks = [
    { label: 'Shop Kits', href: '/collections/diy-kits' },
    { label: 'Gift Experiences', href: '/collections/gift-experiences' },
    { label: 'Workshops', href: '/workshops' },
    { label: 'Customisation', href: '/customisation' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'Founder Story', href: '/founder-story' },
  ];

  return (
    <>
      {showPromoBar && <PromoBar />}

      <div className="sticky top-0 z-40 px-4 sm:px-6 pt-3 pointer-events-none">
        <header
          className={`pointer-events-auto max-w-7xl mx-auto flex items-center justify-between gap-4 rounded-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] backdrop-blur-xl ${
            isScrolled || variant === 'solid'
              ? 'bg-deep-wine/90 ring-1 ring-gold/30 py-2 px-3 sm:px-4 shadow-[0_16px_48px_-12px_rgba(31,5,6,0.55)]'
              : 'bg-deep-wine/72 ring-1 ring-gold/20 py-2.5 px-3 sm:px-5 shadow-[0_12px_40px_-16px_rgba(31,5,6,0.45)]'
          }`}
        >
          <Link href="/" className="group flex-shrink-0 pl-1">
            <HoopLogo size={32} />
          </Link>

          <nav className="hidden md:flex items-center gap-6 lg:gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-body text-[11px] uppercase tracking-[0.14em] text-cream/85 hover:text-antique-gold transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] relative group py-1"
              >
                {link.label}
                <span className="absolute bottom-0 left-0 w-0 h-px bg-gold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:w-full" />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleCart}
              className="relative w-10 h-10 flex items-center justify-center text-cream hover:text-antique-gold transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] rounded-full hover:bg-gold/10 cursor-pointer"
              aria-label="Open Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" strokeWidth={1.25} />
              {totalCartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[1rem] h-4 px-1 bg-gold text-wine text-[9px] font-bold rounded-full flex items-center justify-center">
                  {totalCartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden relative w-10 h-10 flex items-center justify-center text-cream rounded-full hover:bg-gold/10 cursor-pointer"
              aria-label="Open Mobile Menu"
              aria-expanded={mobileNavOpen}
            >
              <span className="sr-only">Menu</span>
              <span className="relative w-4 h-3.5 flex flex-col justify-between" aria-hidden="true">
                <span className="block h-px w-full bg-current rounded-full" />
                <span className="block h-px w-full bg-current rounded-full" />
                <span className="block h-px w-3/4 bg-current rounded-full self-end" />
              </span>
            </button>
          </div>
        </header>
      </div>

      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        links={navLinks}
      />
    </>
  );
};
