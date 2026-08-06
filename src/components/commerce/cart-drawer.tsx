'use client';

import React from 'react';
import Image from 'next/image';
import { useCartStore } from '@/lib/cart/cart-store';
import { useDrawer } from '@/hooks/use-drawer';
import { ShoppingBag, Plus, Minus, Trash2 } from 'lucide-react';
import { CtaButton } from '../common/cta-button';
import { DoubleBezel } from '../common/double-bezel';

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
      <div
        className="absolute inset-0 bg-wine/55 backdrop-blur-sm transition-opacity duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Shopping cart"
          className="w-screen max-w-md bg-cream-warm text-wine shadow-[0_28px_64px_-32px_rgba(56,11,12,0.28)] flex flex-col"
        >
          <div className="p-6 bg-deep-wine text-cream flex items-center justify-between ring-1 ring-inset ring-gold/20">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5 text-gold" strokeWidth={1.25} />
              <h3 className="font-display text-lg tracking-wide">Your Quiet Basket</h3>
              {cart?.totalQuantity ? (
                <span className="text-[10px] bg-gold text-wine font-semibold px-2 py-0.5 rounded-full">
                  {cart.totalQuantity}
                </span>
              ) : null}
            </div>
            <button
              onClick={closeCart}
              className="relative w-9 h-9 rounded-full flex items-center justify-center text-cream/70 hover:text-gold hover:bg-gold/10 transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
              aria-label="Close cart"
            >
              <span className="absolute w-3.5 h-px bg-current rotate-45" />
              <span className="absolute w-3.5 h-px bg-current -rotate-45" />
            </button>
          </div>

          <div className="bg-wine/[0.04] p-4 ring-1 ring-inset ring-wine/5 text-xs font-body">
            {remainingForFreeShipping > 0 ? (
              <p className="text-wine/80 mb-2">
                Add <span className="font-semibold text-wine">₹{remainingForFreeShipping}</span> more
                to unlock <span className="text-gold font-semibold">Free Shipping</span>.
              </p>
            ) : (
              <p className="text-gold font-medium mb-2">
                Congratulations — free shipping unlocked.
              </p>
            )}
            <div className="w-full bg-wine/10 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gold h-full origin-left transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] rounded-full"
                style={{ transform: `scaleX(${progressPercent / 100})` }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {!cart?.lines || cart.lines.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-wine/[0.04] ring-1 ring-gold/25 flex items-center justify-center text-gold">
                  <ShoppingBag className="w-7 h-7" strokeWidth={1.2} />
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
                <DoubleBezel key={line.id} className="!rounded-[1.25rem]" coreClassName="!rounded-[calc(1.25rem-0.375rem)]">
                  <div className="flex gap-4 p-3">
                    <div className="w-20 h-20 relative bg-wine/5 rounded-xl overflow-hidden flex-shrink-0">
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

                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <h4 className="font-display text-base font-medium text-wine leading-snug truncate">
                            {line.product.title}
                          </h4>
                          <p className="font-body text-xs text-wine/60 font-light">
                            {line.variant.title}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(line.id)}
                          className="text-wine/40 hover:text-wine p-1 transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={1.25} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center rounded-full bg-white ring-1 ring-wine/10">
                          <button
                            onClick={() => updateQuantity(line.id, line.quantity - 1)}
                            className="px-2.5 py-1.5 text-wine/70 hover:text-wine transition-colors"
                          >
                            <Minus className="w-3 h-3" strokeWidth={1.25} />
                          </button>
                          <span className="px-2 text-xs font-semibold">{line.quantity}</span>
                          <button
                            onClick={() => updateQuantity(line.id, line.quantity + 1)}
                            className="px-2.5 py-1.5 text-wine/70 hover:text-wine transition-colors"
                          >
                            <Plus className="w-3 h-3" strokeWidth={1.25} />
                          </button>
                        </div>

                        <span className="font-display text-sm font-medium text-wine">
                          ₹{line.variant.price * line.quantity}
                        </span>
                      </div>
                    </div>
                  </div>
                </DoubleBezel>
              ))
            )}
          </div>

          {cart?.lines && cart.lines.length > 0 && (
            <div className="p-6 bg-white/80 ring-1 ring-inset ring-wine/5 space-y-4">
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
