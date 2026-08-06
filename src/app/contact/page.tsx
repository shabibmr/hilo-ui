'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CartDrawer } from '@/components/commerce/cart-drawer';
import { Container } from '@/components/common/container';
import { SectionHeading } from '@/components/common/section-heading';
import { CtaButton } from '@/components/common/cta-button';
import { Mail, MessageCircle, Globe, CheckCircle } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-cream text-wine font-body">
      <Header variant="solid" />

      <main className="flex-1 pt-28 pb-20">
        <Container>
          <SectionHeading
            eyebrow="REACH OUR STUDIO"
            headline="Contact HILO ARTE"
            subheadline="We are here to assist with kit recommendations, order status, or custom gifting inquiries."
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-5xl mx-auto">
            {/* Direct Contact Channels */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-wine/10 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-wine/5 flex items-center justify-center text-gold flex-shrink-0">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-display text-lg font-medium text-wine">Email Studio</h4>
                  <p className="text-xs text-wine/60 font-light mt-0.5">hello@hiloarte.com</p>
                  <span className="text-[11px] text-gold font-accent italic mt-1 block">Replies within 12 hours</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-wine/10 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-wine/5 flex items-center justify-center text-gold flex-shrink-0">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-display text-lg font-medium text-wine">WhatsApp Concierge</h4>
                  <p className="text-xs text-wine/60 font-light mt-0.5">+91 98765 43210</p>
                  <span className="text-[11px] text-gold font-accent italic mt-1 block">Available Mon–Sat, 10am–7pm IST</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-wine/10 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-wine/5 flex items-center justify-center text-gold flex-shrink-0">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-display text-lg font-medium text-wine">Studio Location</h4>
                  <p className="text-xs text-wine/60 font-light mt-0.5">Jaipur, Rajasthan, India</p>
                </div>
              </div>
            </div>

            {/* Interactive Contact Form */}
            <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-2xl border border-wine/10 shadow-wine-sm">
              {submitted ? (
                <div className="p-8 text-center space-y-4 animate-fadeIn">
                  <CheckCircle className="w-12 h-12 text-gold mx-auto" />
                  <h3 className="font-display text-2xl text-wine">Message Received</h3>
                  <p className="text-sm text-wine/70 font-light">
                    Thank you for reaching out. A member of our studio team will respond to your message shortly.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSubmitted(true);
                  }}
                  className="space-y-4"
                >
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
                  <input
                    type="text"
                    placeholder="Subject / Order Number (Optional)"
                    className="w-full bg-cream/50 border border-wine/20 rounded-md p-3 text-sm"
                  />
                  <textarea
                    placeholder="How can we assist your quiet journey today?"
                    rows={5}
                    required
                    className="w-full bg-cream/50 border border-wine/20 rounded-md p-3 text-sm"
                  />
                  <CtaButton type="submit" fullWidth size="lg">
                    Send Message
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
