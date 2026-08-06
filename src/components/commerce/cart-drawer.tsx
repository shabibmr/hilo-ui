'use client';

import React from 'react';
import Image from 'next/image';
import { useCartStore } from '@/lib/cart/cart-store';
import { useDrawer } from '@/hooks/use-drawer';
import { X, ShoppingBag, Plus, Minus, Trash2 } from 'lucide-react';
import { CtaButton } from '../common/cta-button';

export const CartDrawer: React.FC = () => {
  const { cart, isOpen, closeCart, updateQuantity, removeItem } = useCartStore();
  const panelRef = useDrawer<HTMLDivElement>(isOpen, closeCart);

  if (!isOpen) return null;

  const subtotal = cart?.subtotal || 0;
  const freeShippingThreshold = 1499;
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop Overlay */}
      <div
        className="absolute inset-0 bg-wine/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Shopping cart"
          className="w-screen max-w-md bg-cream text-wine shadow-2xl flex flex-col"
        >
          {/* Drawer Header */}
          <div className="p-6 bg-deep-wine text-cream flex items-center justify-between border-b border-gold/20">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5 text-gold" />
              <h3 className="font-display text-lg tracking-wide">Your Quiet Basket</h3>
              {cart?.totalQuantity ? (
                <span className="text-xs bg-gold text-wine font-semibold px-2 py-0.5 rounded-full">
                  {cart.totalQuantity}
                </span>
              ) : null}
            </div>
            <button
              onClick={closeCart}
              className="p-1.5 text-cream/70 hover:text-gold transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="bg-wine/5 p-4 border-b border-wine/10 text-xs font-body">
            {remainingForFreeShipping > 0 ? (
              <p className="text-wine/80 mb-2">
                Add <span className="font-semibold text-wine">₹{remainingForFreeShipping}</span> more to unlock <span className="text-gold font-semibold">Free Shipping</span>.
              </p>
            ) : (
              <p className="text-gold font-medium mb-2 flex items-center gap-1.5">
                ✨ Congratulations! You unlocked Free Shipping.
              </p>
            )}
            <div className="w-full bg-wine/10 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gold h-full transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {!cart?.lines || cart.lines.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-wine/5 flex items-center justify-center text-gold">
                  <ShoppingBag className="w-8 h-8 stroke-[1.2]" />
                </div>
                <p className="font-display text-xl text-wine font-normal">Your basket is quiet.</p>
                <p className="font-accent italic text-sm text-wine/60">
                  Begin your slow creative journey with one of our handcrafted kits.
                </p>
                <CtaButton href="/collections/diy-kits" onClick={closeCart} size="sm">
                  Explore DIY Kits
                </CtaButton>
              </div>
            ) : (
              cart.lines.map((line) => (
                <div key={line.id} className="flex gap-4 p-3 bg-white/60 rounded-lg border border-wine/10">
                  {/* Thumbnail */}
                  <div className="w-20 h-20 relative bg-wine/5 rounded-md overflow-hidden flex-shrink-0">
                    {line.product.images[0]?.url ? (
                      <Image
                        src={line.product.images[0].url}
                        alt={line.product.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-wine/10 flex items-center justify-center text-xs text-wine/40">
                        HILO
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-display text-base font-medium text-wine leading-snug">
                          {line.product.title}
                        </h4>
                        <p className="font-body text-xs text-wine/60 font-light">
                          {line.variant.title}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(line.id)}
                        className="text-wine/40 hover:text-wine p-1 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-wine/20 rounded-md bg-white">
                        <button
                          onClick={() => updateQuantity(line.id, line.quantity - 1)}
                          className="px-2 py-1 text-wine/70 hover:text-wine transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 text-xs font-semibold">{line.quantity}</span>
                        <button
                          onClick={() => updateQuantity(line.id, line.quantity + 1)}
                          className="px-2 py-1 text-wine/70 hover:text-wine transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line Price */}
                      <span className="font-body text-sm font-semibold text-wine">
                        ₹{line.variant.price * line.quantity}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Subtotal & Checkout Action */}
          {cart?.lines && cart.lines.length > 0 && (
            <div className="p-6 bg-white border-t border-wine/10 space-y-4">
              <div className="flex justify-between items-center text-base">
                <span className="font-body text-wine/70">Subtotal</span>
                <span className="font-display font-semibold text-xl text-wine">₹{subtotal}</span>
              </div>
              <p className="text-[11px] text-wine/50 text-center font-light">
                Taxes and shipping calculated at checkout.
              </p>
              <CtaButton href="/checkout" onClick={closeCart} fullWidth size="lg">
                Proceed to Checkout
              </CtaButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
