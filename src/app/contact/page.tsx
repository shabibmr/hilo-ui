'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CartDrawer } from '@/components/commerce/cart-drawer';
import { Container } from '@/components/common/container';
import { SectionHeading } from '@/components/common/section-heading';
import { CtaButton } from '@/components/common/cta-button';
import { Mail, MessageCircle, Globe, CheckCircle, Loader2 } from 'lucide-react';
import { contentRepository } from '@/lib/data/providers';
import { useSiteSettings } from '@/lib/data/use-live';
import { DataErrorState } from '@/components/common/error-retry';

export default function ContactPage() {
  const { settings, error: settingsError, reload: reloadSettings } = useSiteSettings();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const fullMessage = subject.trim() ? `[Subject: ${subject.trim()}]\n\n${message.trim()}` : message.trim();
      await contentRepository.submitEnquiry({
        name: name.trim(),
        email: email.trim(),
        message: fullMessage,
        kind: 'contact',
      });
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send message. Please try again.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const storeEmail = settings?.store?.email || '';
  const storePhone = settings?.social?.whatsapp || settings?.store?.phone || '';
  const whatsappClean = storePhone.replace(/[^0-9]/g, '');
  const storeAddress = settings?.store?.address || '';

  return (
    <div className="min-h-screen flex flex-col bg-cream-warm text-wine font-body">
      <Header variant="solid" />

      <main className="flex-1 pt-10 pb-20">
        <Container>
          <SectionHeading
            eyebrow="REACH OUR STUDIO"
            headline="Contact HILO ARTE"
            subheadline="We are here to assist with kit recommendations, order status, or custom gifting inquiries."
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-5xl mx-auto">
            {/* Direct Contact Channels */}
            <div className="lg:col-span-5 space-y-6">
              {settingsError ? (
                <DataErrorState
                  title="Unable to load studio address"
                  message={settingsError}
                  onRetry={reloadSettings}
                  className="my-0"
                />
              ) : (
                <>
              {storeEmail && (
              <a
                href={`mailto:${storeEmail}`}
                className="bg-white p-6 rounded-2xl ring-1 ring-wine/5 flex items-start gap-4 hover:ring-gold/30 transition-all block"
              >
                <div className="w-12 h-12 rounded-xl bg-wine/5 flex items-center justify-center text-gold flex-shrink-0">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-display text-lg font-medium text-wine">Email Studio</h4>
                  <p className="text-xs text-wine/60 font-light mt-0.5">{storeEmail}</p>
                  <span className="text-[11px] text-gold font-accent italic mt-1 block">
                    Replies within 12 hours
                  </span>
                </div>
              </a>
              )}

              {whatsappClean && (
              <a
                href={`https://wa.me/${whatsappClean}`}
                target="_blank"
                rel="noreferrer"
                className="bg-white p-6 rounded-2xl ring-1 ring-wine/5 flex items-start gap-4 hover:ring-gold/30 transition-all block"
              >
                <div className="w-12 h-12 rounded-xl bg-wine/5 flex items-center justify-center text-gold flex-shrink-0">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-display text-lg font-medium text-wine">WhatsApp Concierge</h4>
                  <p className="text-xs text-wine/60 font-light mt-0.5">{storePhone}</p>
                  <span className="text-[11px] text-gold font-accent italic mt-1 block">
                    Available Mon–Sat, 10am–7pm IST
                  </span>
                </div>
              </a>
              )}

              {storeAddress && (
              <div className="bg-white p-6 rounded-2xl ring-1 ring-wine/5 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-wine/5 flex items-center justify-center text-gold flex-shrink-0">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-display text-lg font-medium text-wine">Studio Location</h4>
                  <p className="text-xs text-wine/60 font-light mt-0.5">{storeAddress}</p>
                  {settings?.store?.hours && (
                    <span className="text-[11px] text-gold font-accent italic mt-1 block">
                      {settings.store.hours}
                    </span>
                  )}
                </div>
              </div>
              )}
                </>
              )}
            </div>

            {/* Interactive Contact Form */}
            <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-2xl ring-1 ring-wine/5 shadow-wine-sm">
              {submitted ? (
                <div className="p-8 text-center space-y-4 animate-fadeIn">
                  <CheckCircle className="w-12 h-12 text-gold mx-auto" />
                  <h3 className="font-display text-2xl text-wine">Message Received</h3>
                  <p className="text-sm text-wine/70 font-light">
                    Thank you for reaching out, {name}. A member of our studio team will review your
                    inquiry and respond shortly.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setName('');
                      setEmail('');
                      setSubject('');
                      setMessage('');
                    }}
                    className="mt-4 text-xs font-semibold uppercase tracking-wider text-gold hover:text-wine underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {errorMsg && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                      {errorMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Your Name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-cream/50 border border-wine/20 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-cream/50 border border-wine/20 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Subject / Order Number (Optional)"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-cream/50 border border-wine/20 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                  <textarea
                    placeholder="How can we assist your quiet journey today?"
                    rows={5}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full bg-cream/50 border border-wine/20 rounded-2xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-gold resize-none"
                  />
                  <CtaButton type="submit" fullWidth size="lg" disabled={submitting}>
                    {submitting ? (
                      <span className="flex items-center justify-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Message...</span>
                      </span>
                    ) : (
                      'Send Message'
                    )}
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
