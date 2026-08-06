'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/cart/cart-store';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Container } from '@/components/common/container';
import { CtaButton } from '@/components/common/cta-button';
import { ShieldCheck, CreditCard, Smartphone } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart } = useCartStore();
  const [paymentMethod, setPaymentMethod] = useState('upi');

  const subtotal = cart?.subtotal || 0;
  const shipping = subtotal >= 1499 || subtotal === 0 ? 0 : 99;
  const total = subtotal + shipping;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/checkout/confirmation');
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream text-wine font-body">
      <Header variant="solid" />

      <main className="flex-1 pt-28 pb-20">
        <Container>
          <div className="max-w-4xl mx-auto">
            <h1 className="font-display text-h1 text-wine text-center mb-8">Checkout</h1>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Shipping & Payment Form */}
              <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-8 bg-white p-8 rounded-xl border border-wine/10">
                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="font-display text-xl text-wine font-medium">1. Contact Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-xs font-medium text-wine/70 mb-1.5">
                        First Name
                      </label>
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        autoComplete="given-name"
                        required
                        className="w-full bg-cream/50 border border-wine/20 rounded-md p-3 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-xs font-medium text-wine/70 mb-1.5">
                        Last Name
                      </label>
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        autoComplete="family-name"
                        required
                        className="w-full bg-cream/50 border border-wine/20 rounded-md p-3 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-xs font-medium text-wine/70 mb-1.5">
                      Email Address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="For order updates"
                      required
                      className="w-full bg-cream/50 border border-wine/20 rounded-md p-3 text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-xs font-medium text-wine/70 mb-1.5">
                      Mobile Number
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="For delivery tracking"
                      required
                      className="w-full bg-cream/50 border border-wine/20 rounded-md p-3 text-sm"
                    />
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="space-y-4 pt-4 border-t border-wine/10">
                  <h3 className="font-display text-xl text-wine font-medium">2. Shipping Address</h3>
                  <div>
                    <label htmlFor="street" className="block text-xs font-medium text-wine/70 mb-1.5">
                      Street Address / House No.
                    </label>
                    <input
                      id="street"
                      name="street"
                      type="text"
                      autoComplete="street-address"
                      required
                      className="w-full bg-cream/50 border border-wine/20 rounded-md p-3 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="city" className="block text-xs font-medium text-wine/70 mb-1.5">
                        City
                      </label>
                      <input
                        id="city"
                        name="city"
                        type="text"
                        autoComplete="address-level2"
                        required
                        className="w-full bg-cream/50 border border-wine/20 rounded-md p-3 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="state" className="block text-xs font-medium text-wine/70 mb-1.5">
                        State
                      </label>
                      <input
                        id="state"
                        name="state"
                        type="text"
                        autoComplete="address-level1"
                        required
                        className="w-full bg-cream/50 border border-wine/20 rounded-md p-3 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="pincode" className="block text-xs font-medium text-wine/70 mb-1.5">
                        Pincode
                      </label>
                      <input
                        id="pincode"
                        name="pincode"
                        type="text"
                        inputMode="numeric"
                        autoComplete="postal-code"
                        required
                        className="w-full bg-cream/50 border border-wine/20 rounded-md p-3 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Selection */}
                <div className="space-y-4 pt-4 border-t border-wine/10">
                  <h3 className="font-display text-xl text-wine font-medium">3. Payment Method</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-4 border border-wine/20 rounded-lg cursor-pointer bg-cream/30">
                      <input
                        type="radio"
                        name="payment"
                        value="upi"
                        checked={paymentMethod === 'upi'}
                        onChange={() => setPaymentMethod('upi')}
                      />
                      <Smartphone className="w-5 h-5 text-gold" />
                      <span className="font-body text-sm font-medium">UPI / GPay / PhonePe / Paytm</span>
                    </label>

                    <label className="flex items-center gap-3 p-4 border border-wine/20 rounded-lg cursor-pointer bg-cream/30">
                      <input
                        type="radio"
                        name="payment"
                        value="card"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                      />
                      <CreditCard className="w-5 h-5 text-gold" />
                      <span className="font-body text-sm font-medium">Credit / Debit Cards / Netbanking</span>
                    </label>
                  </div>
                </div>

                <CtaButton type="submit" fullWidth size="lg">
                  Complete Order — ₹{total}
                </CtaButton>
              </form>

              {/* Order Summary */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white/70 p-6 rounded-xl border border-wine/10 space-y-4">
                  <h3 className="font-display text-xl text-wine font-medium">Order Summary</h3>

                  <div className="space-y-3">
                    {cart?.lines.map((line) => (
                      <div key={line.id} className="flex justify-between items-center text-xs">
                        <div>
                          <p className="font-medium text-wine">{line.product.title}</p>
                          <p className="text-wine/60">Qty: {line.quantity}</p>
                        </div>
                        <span className="font-semibold text-wine">₹{line.variant.price * line.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-wine/10 pt-4 space-y-2 text-sm">
                    <div className="flex justify-between text-wine/70">
                      <span>Subtotal</span>
                      <span>₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between text-wine/70">
                      <span>Shipping</span>
                      <span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
                    </div>
                    <div className="flex justify-between font-display text-lg font-semibold text-wine pt-2 border-t border-wine/10">
                      <span>Total</span>
                      <span>₹{total}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-wine/60 font-light justify-center">
                  <ShieldCheck className="w-4 h-4 text-gold" />
                  <span>Encrypted 256-bit Secure Checkout</span>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
