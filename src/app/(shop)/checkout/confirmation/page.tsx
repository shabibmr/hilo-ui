'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Container } from '@/components/common/container';
import { CtaButton } from '@/components/common/cta-button';
import { DataErrorState } from '@/components/common/error-retry';
import { CheckCircle2 } from 'lucide-react';

function ConfirmationBody() {
  const params = useSearchParams();
  const orderId = params.get('order');
  const preview = params.get('preview');

  if (!orderId && preview !== '1') {
    return (
      <div className="space-y-4 text-center">
        <DataErrorState
          title="Missing order reference"
          message="This confirmation page needs an order id or a preview flag."
        />
        <Link
          href="/checkout"
          className="inline-block text-xs uppercase tracking-[0.14em] font-medium text-gold hover:text-wine"
        >
          Return to checkout
        </Link>
      </div>
    );
  }

  if (preview === '1' && !orderId) {
    return (
      <div className="bg-white p-8 sm:p-12 rounded-2xl ring-1 ring-wine/5 text-center space-y-6 shadow-wine-sm">
        <span className="text-eyebrow text-xs tracking-[0.25em] text-gold font-accent block">
          — PREVIEW —
        </span>
        <h1 className="font-display text-h1 text-wine">No order was placed.</h1>
        <p className="font-body text-base text-wine/70 font-light max-w-md mx-auto leading-relaxed">
          This was a mock checkout. No payment was taken and nothing was reserved.
        </p>
        <div className="pt-4">
          <CtaButton href="/" variant="solid-gold">
            Return to Homepage
          </CtaButton>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 sm:p-12 rounded-2xl ring-1 ring-wine/5 text-center space-y-6 shadow-wine-sm">
      <div className="w-16 h-16 bg-wine/5 rounded-full flex items-center justify-center text-gold mx-auto border border-gold/30">
        <CheckCircle2 className="w-10 h-10 stroke-[1.5]" />
      </div>

      <span className="text-eyebrow text-xs tracking-[0.25em] text-gold font-accent block">
        — ORDER RECEIVED —
      </span>

      <h1 className="font-display text-h1 text-wine">Your quiet box is on its way.</h1>

      <p className="font-body text-base text-wine/70 font-light max-w-md mx-auto leading-relaxed">
        Thank you for starting your embroidery journey with HILO ARTE. We have received your order
        and are carefully preparing your presentation kit.
      </p>

      {orderId ? (
        <p className="font-body text-xs text-wine/60">
          Order reference: <span className="font-mono">{orderId}</span>
          <br />
          Your payment is being confirmed by our bank and you&apos;ll get an email shortly.
        </p>
      ) : null}

      <div className="pt-4">
        <CtaButton href="/" variant="solid-gold">
          Return to Homepage
        </CtaButton>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <div className="min-h-screen flex flex-col bg-cream-warm text-wine font-body">
      <Header variant="solid" />

      <main className="flex-1 pt-32 pb-20 flex items-center justify-center">
        <Container size="sm">
          <Suspense fallback={null}>
            <ConfirmationBody />
          </Suspense>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
