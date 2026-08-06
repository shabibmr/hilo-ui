'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/header';
import { PromoBar } from '@/components/layout/promo-bar';
import { Footer } from '@/components/layout/footer';
import { CartDrawer } from '@/components/commerce/cart-drawer';
import { Container } from '@/components/common/container';
import { SectionHeading } from '@/components/common/section-heading';
import { CtaButton } from '@/components/common/cta-button';
import { CheckCircle } from 'lucide-react';

export default function CustomisationPage() {
  const [monogram, setMonogram] = useState('N');
  const [fabricColor, setFabricColor] = useState('Cream');
  const [threadPalette, setThreadPalette] = useState('Vintage Rose & Gold');
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-cream text-wine font-body">
      <PromoBar />
      <Header variant="solid" />

      <main className="flex-1 pt-28 pb-20">
        <Container>
          <SectionHeading
            eyebrow="BESPOKE EMBROIDERY"
            headline="Custom Embroidery Builder"
            subheadline="Personalize an embroidery kit with custom monograms, names, or special dates for weddings and gifts."
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-5xl mx-auto">
            {/* Live Interactive Preview */}
            <div className="lg:col-span-5 bg-white p-8 rounded-2xl border border-wine/10 flex flex-col items-center justify-center text-center space-y-6 shadow-wine-sm">
              <div className="w-64 h-64 rounded-full border-4 border-gold/40 bg-cream flex flex-col items-center justify-center relative shadow-inner">
                <span className="font-display text-7xl font-bold text-wine tracking-wider">
                  {monogram || 'H'}
                </span>
                <span className="font-accent italic text-xs text-gold mt-2">
                  {threadPalette}
                </span>
              </div>
              <div className="text-xs text-wine/60 font-light">
                <span>Selected Fabric: <strong className="text-wine font-medium">{fabricColor}</strong></span>
              </div>
            </div>

            {/* Customization Controls Form */}
            <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-2xl border border-wine/10">
              {submitted ? (
                <div className="p-8 text-center space-y-4 animate-fadeIn">
                  <CheckCircle className="w-12 h-12 text-gold mx-auto" />
                  <h3 className="font-display text-2xl text-wine">Custom Order Request Sent</h3>
                  <p className="text-sm text-wine/70 font-light">
                    Our studio team will review your custom monogram specification and send a visual digital proof to your email within 12 hours.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSubmitted(true);
                  }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className="font-display text-base font-medium text-wine block">
                      1. Custom Initial / Monogram Letter
                    </label>
                    <input
                      type="text"
                      maxLength={3}
                      value={monogram}
                      onChange={(e) => setMonogram(e.target.value.toUpperCase())}
                      placeholder="e.g. N or H&A"
                      className="w-full bg-cream/50 border border-wine/20 rounded-md p-3 text-sm font-display text-lg uppercase tracking-wider"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="font-display text-base font-medium text-wine block">
                      2. Washed Organic Linen Base Color
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {['Warm Cream', 'Deep Wine', 'Soft Sage'].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFabricColor(color)}
                          className={`p-3 rounded-lg border text-xs font-medium text-center transition-all cursor-pointer ${
                            fabricColor === color
                              ? 'border-gold bg-gold/10 text-wine font-semibold shadow-sm'
                              : 'border-wine/20 text-wine/70 hover:border-wine/40'
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="font-display text-base font-medium text-wine block">
                      3. Thread Palette Selection
                    </label>
                    <select
                      value={threadPalette}
                      onChange={(e) => setThreadPalette(e.target.value)}
                      className="w-full bg-cream/50 border border-wine/20 rounded-md p-3 text-sm text-wine"
                    >
                      <option value="Vintage Rose & Gold">Vintage Rose & Metallic Gold</option>
                      <option value="Moonlit Silver & Indigo">Moonlit Silver & Indigo</option>
                      <option value="Wildflower Botanical Palette">Wildflower Botanical Multi-Color</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="font-display text-base font-medium text-wine block">
                      4. Contact Email for Proof
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="your.email@domain.com"
                      className="w-full bg-cream/50 border border-wine/20 rounded-md p-3 text-sm"
                    />
                  </div>

                  <CtaButton type="submit" fullWidth size="lg">
                    Request Bespoke Custom Proof — ₹2,299
                  </CtaButton>
                </form>
              )}
            </div>
          </div>
        </Container>
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
}
