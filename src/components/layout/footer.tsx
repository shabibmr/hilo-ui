'use client';

import React from 'react';
import Link from 'next/link';
import { HoopLogo } from '../common/hoop-logo';
import { Container } from '../common/container';
import { Globe, Mail, MessageCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-deep-wine text-cream border-t border-gold/30 pt-16 pb-12 relative overflow-hidden">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Col 1: Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <HoopLogo size={36} />
            <p className="font-body text-xs text-cream/70 leading-relaxed font-light mt-4">
              A premium, slow-living luxury creative brand selling beginner embroidery experiences and gift moments across India.
            </p>
            <div className="flex items-center gap-4 text-antique-gold pt-2">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-gold transition-colors">
                <Globe className="w-5 h-5 stroke-[1.5]" />
              </a>
              <a href="mailto:hello@hiloarte.com" className="hover:text-gold transition-colors">
                <Mail className="w-5 h-5 stroke-[1.5]" />
              </a>
              <a href="https://wa.me/" target="_blank" rel="noreferrer" className="hover:text-gold transition-colors">
                <MessageCircle className="w-5 h-5 stroke-[1.5]" />
              </a>
            </div>
          </div>

          {/* Col 2: Shop */}
          <div className="space-y-3">
            <h4 className="font-accent italic text-sm tracking-widest text-antique-gold uppercase">Shop</h4>
            <ul className="space-y-2 text-xs font-body tracking-wider uppercase text-cream/80">
              <li><Link href="/collections/diy-kits" className="hover:text-gold transition-colors">DIY Embroidery Kits</Link></li>
              <li><Link href="/collections/gift-experiences" className="hover:text-gold transition-colors">Gift Experiences</Link></li>
              <li><Link href="/collections/accessories" className="hover:text-gold transition-colors">Accessories</Link></li>
              <li><Link href="/workshops" className="hover:text-gold transition-colors">Workshops</Link></li>
            </ul>
          </div>

          {/* Col 3: About & Help */}
          <div className="space-y-3">
            <h4 className="font-accent italic text-sm tracking-widest text-antique-gold uppercase">About & Help</h4>
            <ul className="space-y-2 text-xs font-body tracking-wider uppercase text-cream/80">
              <li><Link href="/about" className="hover:text-gold transition-colors">Brand Philosophy</Link></li>
              <li><Link href="/founder-story" className="hover:text-gold transition-colors">Founder Story</Link></li>
              <li><Link href="/faq" className="hover:text-gold transition-colors">FAQ & Support</Link></li>
              <li><Link href="/policies/shipping" className="hover:text-gold transition-colors">Shipping & Returns</Link></li>
            </ul>
          </div>

          {/* Col 4: Quiet Newsletter */}
          <div className="space-y-3">
            <h4 className="font-accent italic text-sm tracking-widest text-antique-gold uppercase">Quiet Letters</h4>
            <p className="text-xs text-cream/70 font-light">
              Receive gentle thoughts on slow living, seasonal patterns, and early access to new kit releases.
            </p>
            <form className="space-y-2 pt-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Your email address..."
                className="w-full bg-wine/50 border border-gold/30 rounded-md px-3.5 py-2.5 text-xs text-cream placeholder-cream/40 focus:outline-none focus:border-gold transition-colors"
              />
              <button
                type="submit"
                className="w-full bg-gold text-wine hover:bg-antique-gold text-xs uppercase tracking-widest font-semibold py-2.5 rounded-md transition-colors shadow-gold-glow"
              >
                Join Quiet Letters
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gold/20 pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-cream/50 font-body gap-4">
          <p>© {new Date().getFullYear()} HILO ARTE. All rights reserved.</p>
          <div className="flex gap-6 uppercase tracking-wider">
            <Link href="/policies/privacy" className="hover:text-cream">Privacy Policy</Link>
            <Link href="/policies/refund" className="hover:text-cream">Refund Policy</Link>
          </div>
        </div>
      </Container>
    </footer>
  );
};
