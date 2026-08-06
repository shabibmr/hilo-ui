'use client';

import React from 'react';
import Link from 'next/link';
import { HoopLogo } from '../common/hoop-logo';
import { Container } from '../common/container';
import { Mail, MessageCircle, Camera } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-wine-ink text-cream pt-20 pb-10 relative overflow-hidden">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="space-y-4 md:col-span-1">
            <HoopLogo size={36} />
            <p className="font-body text-xs text-cream/60 leading-relaxed font-light mt-4 max-w-xs">
              A premium, slow-living luxury creative brand selling beginner embroidery experiences
              and gift moments across India.
            </p>
            <div className="flex items-center gap-2.5 text-antique-gold pt-2">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full ring-1 ring-gold/30 flex items-center justify-center hover:bg-gold/10 hover:text-gold transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                aria-label="Instagram"
              >
                <Camera className="w-4 h-4" strokeWidth={1.25} />
              </a>
              <a
                href="mailto:hello@hiloarte.com"
                className="w-9 h-9 rounded-full ring-1 ring-gold/30 flex items-center justify-center hover:bg-gold/10 hover:text-gold transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                aria-label="Email"
              >
                <Mail className="w-4 h-4" strokeWidth={1.25} />
              </a>
              <a
                href="https://wa.me/"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full ring-1 ring-gold/30 flex items-center justify-center hover:bg-gold/10 hover:text-gold transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" strokeWidth={1.25} />
              </a>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-accent italic text-sm tracking-[0.16em] text-antique-gold uppercase">
              Shop
            </h4>
            <ul className="space-y-2.5 text-[11px] font-body tracking-[0.12em] uppercase text-cream/70">
              <li>
                <Link
                  href="/collections/diy-kits"
                  className="hover:text-gold transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                >
                  DIY Embroidery Kits
                </Link>
              </li>
              <li>
                <Link
                  href="/collections/gift-experiences"
                  className="hover:text-gold transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                >
                  Gift Experiences
                </Link>
              </li>
              <li>
                <Link
                  href="/collections/accessories"
                  className="hover:text-gold transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                >
                  Accessories
                </Link>
              </li>
              <li>
                <Link
                  href="/workshops"
                  className="hover:text-gold transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                >
                  Workshops
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-accent italic text-sm tracking-[0.16em] text-antique-gold uppercase">
              About & Help
            </h4>
            <ul className="space-y-2.5 text-[11px] font-body tracking-[0.12em] uppercase text-cream/70">
              <li>
                <Link
                  href="/about"
                  className="hover:text-gold transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                >
                  Brand Philosophy
                </Link>
              </li>
              <li>
                <Link
                  href="/founder-story"
                  className="hover:text-gold transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                >
                  Founder Story
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="hover:text-gold transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                >
                  FAQ & Support
                </Link>
              </li>
              <li>
                <Link
                  href="/policies/shipping"
                  className="hover:text-gold transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                >
                  Shipping & Returns
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-accent italic text-sm tracking-[0.16em] text-antique-gold uppercase">
              Quiet Letters
            </h4>
            <p className="text-xs text-cream/60 font-light leading-relaxed">
              Receive gentle thoughts on slow living, seasonal patterns, and early access to new kit
              releases.
            </p>
            <form className="space-y-2 pt-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Your email address…"
                className="w-full bg-wine/40 ring-1 ring-gold/25 rounded-full px-4 py-2.5 text-xs text-cream placeholder-cream/40 focus:outline-none focus:ring-gold/55 transition-shadow duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
              />
              <button
                type="submit"
                className="w-full bg-gold text-wine hover:bg-antique-gold text-[11px] uppercase tracking-[0.14em] font-semibold py-2.5 rounded-full transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-[0_0_32px_-4px_rgba(176,141,87,0.28)] cursor-pointer"
              >
                Join Quiet Letters
              </button>
            </form>
          </div>
        </div>

        <div className="pt-8 ring-1 ring-inset ring-transparent border-t border-gold/15 flex flex-col sm:flex-row items-center justify-between text-[11px] text-cream/40 font-body gap-4">
          <p>© {new Date().getFullYear()} HILO ARTE. All rights reserved.</p>
          <div className="flex gap-6 uppercase tracking-[0.12em]">
            <Link
              href="/policies/privacy"
              className="hover:text-cream transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
            >
              Privacy Policy
            </Link>
            <Link
              href="/policies/refund"
              className="hover:text-cream transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
            >
              Refund Policy
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
};
