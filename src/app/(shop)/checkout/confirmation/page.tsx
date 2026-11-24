'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Container } from '@/components/common/container';
import { CtaButton } from '@/components/common/cta-button';
import { DataErrorState } from '@/components/common/error-retry';
import { CheckCircle2, Clock3, AlertCircle, RefreshCw } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api-url';
import { useCartStore } from '@/lib/cart/cart-store';

type PaymentStatus = 'checking' | 'pending' | 'captured' | 'failed' | 'refunded' | 'error';

interface PaymentStatusResponse {
  orderId: string;
  orderStatus: string;
  paymentStatus: 'pending' | 'captured' | 'failed' | 'refunded';
}

function ConfirmationBody() {
  const params = useSearchParams();
  const orderId = params.get('order');
  const clearCart = useCartStore((state) => state.clearCart);
  const [status, setStatus] = useState<PaymentStatus>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [pollingTimedOut, setPollingTimedOut] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const startedAt = Date.now();
    const controller = new AbortController();

    const checkStatus = async () => {
      try {
        const response = await fetch(
          `${getApiBaseUrl()}/api/v1/checkout/orders/${encodeURIComponent(orderId)}/status`,
          { cache: 'no-store', signal: controller.signal }
        );
        if (!response.ok) throw new Error('Unable to verify the order status.');
        const result = await response.json() as PaymentStatusResponse;
        if (!active) return;

        setLastChecked(new Date());
        setStatus(result.paymentStatus);
        if (result.paymentStatus === 'captured') clearCart();
        if (result.paymentStatus === 'pending') {
          if (Date.now() - startedAt < 90_000) timer = setTimeout(checkStatus, 2500);
          else setPollingTimedOut(true);
        }
      } catch (error) {
        if (active && !(error instanceof DOMException && error.name === 'AbortError')) {
          setStatus('error');
        }
      }
    };

    void checkStatus();
    return () => {
      active = false;
      controller.abort();
      if (timer) clearTimeout(timer);
    };
  }, [orderId, clearCart]);

  if (!orderId) {
    return (
      <div className="space-y-4 text-center">
        <DataErrorState
          title="Missing order reference"
          message="This confirmation page needs an order id."
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

  const isPaid = status === 'captured';
  const isFailed = status === 'failed';
  const isRefunded = status === 'refunded';
  const isPending = status === 'checking' || status === 'pending';

  return (
    <div className="bg-white p-8 sm:p-12 rounded-2xl ring-1 ring-wine/5 text-center space-y-6 shadow-wine-sm">
      <div className="w-16 h-16 bg-wine/5 rounded-full flex items-center justify-center text-gold mx-auto border border-gold/30">
        {isPaid ? <CheckCircle2 className="w-10 h-10 stroke-[1.5]" /> :
          isPending ? <Clock3 className="w-10 h-10 stroke-[1.5]" /> :
          <AlertCircle className="w-10 h-10 stroke-[1.5]" />}
      </div>

      <span className="text-eyebrow text-xs tracking-[0.25em] text-gold font-accent block">
        {isPaid ? '— PAYMENT CONFIRMED —' :
          isRefunded ? '— PAYMENT REFUNDED —' :
          isFailed ? '— PAYMENT NOT COMPLETED —' :
          isPending ? '— CONFIRMING PAYMENT —' : '— ORDER STATUS —'}
      </span>

      <h1 className="font-display text-h1 text-wine">
        {isPaid ? 'Your order is confirmed.' :
          isRefunded ? 'Your payment has been refunded.' :
          isFailed ? 'Your payment was not completed.' :
          isPending ? 'Your payment is being confirmed.' : 'We could not verify your payment yet.'}
      </h1>

      <p className="font-body text-base text-wine/70 font-light max-w-md mx-auto leading-relaxed">
        {isPaid
          ? 'Thank you for starting your embroidery journey with HILO ARTE. We have confirmed your payment and are preparing your order.'
          : isRefunded
            ? 'The payment arrived after the order was cancelled, so it has been sent for refund. Please contact us if you need assistance.'
            : isFailed
              ? 'The order reservation has expired or was cancelled. If your bank shows a debit, contact us with your order reference.'
              : isPending
                ? 'We are checking the payment confirmation directly with our order system. Please do not make another payment while this check is in progress.'
                : 'Your order reference is valid, but the payment service is temporarily unavailable. Refresh this page in a moment.'}
      </p>

      <p className="font-body text-xs text-wine/60">
        Order reference: <span className="font-mono">{orderId}</span>
        {lastChecked && <><br />Last checked: {lastChecked.toLocaleTimeString()}</>}
      </p>

      {isPending && !pollingTimedOut && (
        <div className="flex items-center justify-center gap-2 text-xs text-wine/55" role="status" aria-live="polite">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          Checking payment status…
        </div>
      )}

      {isPending && pollingTimedOut && (
        <p role="status" className="text-sm text-wine/60">
          Payment is still pending. Check again shortly; do not submit another payment for this order.
        </p>
      )}

      {status === 'error' && (
        <p role="alert" className="text-sm text-red-700">
          Payment status could not be retrieved. You can safely refresh this page to check again.
        </p>
      )}

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
          <Suspense fallback={<div className="min-h-64" aria-busy="true" />}>
            <ConfirmationBody />
          </Suspense>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
