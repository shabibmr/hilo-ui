'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useScrollHeader } from '@/hooks/use-scroll-header';
import { HoopLogo } from '../common/hoop-logo';
import { useCartStore } from '@/lib/cart/cart-store';
import { ShoppingBag, Menu } from 'lucide-react';
import { MobileNav } from './mobile-nav';
import { PromoBar } from './promo-bar';

interface HeaderProps {
  variant?: 'overlay' | 'solid';
  showPromoBar?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ variant = 'overlay', showPromoBar = true }) => {
  const isScrolled = useScrollHeader(40);
  const { cart, toggleCart } = useCartStore();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const totalCartCount = cart?.totalQuantity || 0;
  const isSolidHeader = variant === 'solid' || isScrolled;

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
      <header className="fixed top-0 left-0 right-0 z-40">
        {showPromoBar && <PromoBar />}
        <div
          className={`transition-all duration-500 ${
            isSolidHeader
              ? 'bg-deep-wine/95 backdrop-blur-md border-b border-gold/30 shadow-wine-lg py-3'
              : 'bg-gradient-to-b from-deep-wine/80 to-transparent py-4'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            {/* Brand Logo */}
            <Link href="/" className="group">
              <HoopLogo size={36} />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-body text-xs uppercase tracking-[0.15em] text-cream/90 hover:text-gold transition-colors duration-200 relative group py-1"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-gold transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </nav>

            {/* Action Items: Cart & Mobile Menu */}
            <div className="flex items-center gap-5">
              {/* Cart Drawer Trigger */}
              <button
                onClick={toggleCart}
                className="relative p-2 text-cream hover:text-gold transition-colors duration-200 rounded-full hover:bg-gold/10 cursor-pointer"
                aria-label="Open Shopping Cart"
              >
                <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
                {totalCartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold text-wine text-[10px] font-bold rounded-full flex items-center justify-center shadow-md">
                    {totalCartCount}
                  </span>
                )}
              </button>

              {/* Mobile Hamburger Toggle */}
              <button
                onClick={() => setMobileNavOpen(true)}
                className="md:hidden p-2 text-cream hover:text-gold transition-colors rounded-lg cursor-pointer"
                aria-label="Open Mobile Menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} links={navLinks} />
    </>
  );
};
