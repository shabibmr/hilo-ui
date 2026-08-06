'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/header';
import { PromoBar } from '@/components/layout/promo-bar';
import { Footer } from '@/components/layout/footer';
import { CartDrawer } from '@/components/commerce/cart-drawer';
import { Container } from '@/components/common/container';
import { SectionHeading } from '@/components/common/section-heading';
import { CtaButton } from '@/components/common/cta-button';
import { Users, GraduationCap, Building2, Heart } from 'lucide-react';

export default function WorkshopsPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream text-wine font-body">
      <PromoBar />
      <Header variant="solid" />

      <main className="flex-1 pt-28 pb-20">
        <Container>
          <SectionHeading
            eyebrow="COMMUNITY & CREATIVITY"
            headline="HILO ARTE Workshops"
            subheadline="Gather your team, school, or community for a slow, guided embroidery experience."
          />

          {/* Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <div className="bg-white p-6 rounded-xl border border-wine/10 text-center space-y-3">
              <Building2 className="w-8 h-8 text-gold mx-auto" />
              <h3 className="font-display text-lg font-medium text-wine">Corporates</h3>
              <p className="text-xs text-wine/70 font-light">Wellness pauses, offsite workshops & team bonding sessions.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-wine/10 text-center space-y-3">
              <GraduationCap className="w-8 h-8 text-gold mx-auto" />
              <h3 className="font-display text-lg font-medium text-wine">Schools</h3>
              <p className="text-xs text-wine/70 font-light">Tactile art education and focus-building workshops for students.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-wine/10 text-center space-y-3">
              <Heart className="w-8 h-8 text-gold mx-auto" />
              <h3 className="font-display text-lg font-medium text-wine">Mothers & Groups</h3>
              <p className="text-xs text-wine/70 font-light">Quiet weekend tea & stitching circles for mothers and friends.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-wine/10 text-center space-y-3">
              <Users className="w-8 h-8 text-gold mx-auto" />
              <h3 className="font-display text-lg font-medium text-wine">Communities</h3>
              <p className="text-xs text-wine/70 font-light">Pop-up art experiences for cafes, galleries, and events.</p>
            </div>
          </div>

          {/* Booking Inquiry Form */}
          <div className="max-w-2xl mx-auto bg-white p-8 sm:p-12 rounded-2xl border border-wine/10 shadow-wine-sm">
            <h3 className="font-display text-2xl font-medium text-wine text-center mb-6">
              Inquire for a Custom Workshop
            </h3>

            {submitted ? (
              <div className="p-6 bg-wine/5 border border-gold/30 rounded-xl text-center space-y-3 animate-fadeIn">
                <p className="font-display text-xl text-wine">✨ Inquiry Received</p>
                <p className="font-body text-sm text-wine/70 font-light">
                  Thank you! Our studio team will reach out to you within 24 hours to arrange your workshop.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Your Name"
                    required
                    className="w-full bg-cream/50 border border-wine/20 rounded-md p-3 text-sm"
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    required
                    className="w-full bg-cream/50 border border-wine/20 rounded-md p-3 text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <select required className="w-full bg-cream/50 border border-wine/20 rounded-md p-3 text-sm text-wine">
                    <option value="">Workshop Type...</option>
                    <option value="corporate">Corporate Wellness</option>
                    <option value="school">School / University</option>
                    <option value="mothers">Mothers & Friends Group</option>
                    <option value="community">Community / Cafe Pop-up</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Expected Attendees"
                    required
                    className="w-full bg-cream/50 border border-wine/20 rounded-md p-3 text-sm"
                  />
                </div>
                <textarea
                  placeholder="Tell us about your event, location, and preferred dates..."
                  rows={4}
                  required
                  className="w-full bg-cream/50 border border-wine/20 rounded-md p-3 text-sm"
                />
                <CtaButton type="submit" fullWidth size="lg">
                  Submit Workshop Inquiry
                </CtaButton>
              </form>
            )}
          </div>
        </Container>
      </main>

      <Footer />
      <CartDrawer />
    </div>
  );
}
