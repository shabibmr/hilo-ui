'use client';

import React, { useState } from 'react';
import { Product } from '@/lib/data/types';
import { useCartStore } from '@/lib/cart/cart-store';
import { ShoppingBag, Minus, Plus } from 'lucide-react';
import { CtaButton } from '../common/cta-button';

interface AddToCartButtonProps {
  product: Product;
}

export const AddToCartButton: React.FC<AddToCartButtonProps> = ({ product }) => {
  const [quantity, setQuantity] = useState(1);
  const { addItem, isLoading, error } = useCartStore();
  const variant = product.variants[0];
  const soldOut = !variant?.availableForSale;
  const maxQty = variant?.stock ?? Infinity;

  const handleAdd = () => {
    addItem(product, product.variants[0], quantity);
  };

  return (
    <div className="space-y-2">
    <div className="flex items-center gap-3 sm:gap-4">
      <div className="flex items-center rounded-full bg-white ring-1 ring-wine/10 px-2 py-1.5">
        <button
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          className="p-2 text-wine/60 hover:text-wine cursor-pointer transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
          aria-label="Decrease quantity"
        >
          <Minus className="w-4 h-4" strokeWidth={1.25} />
        </button>
        <span className="w-8 text-center font-semibold text-sm">{quantity}</span>
        <button
          onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
          className="p-2 text-wine/60 hover:text-wine cursor-pointer transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
          aria-label="Increase quantity"
        >
          <Plus className="w-4 h-4" strokeWidth={1.25} />
        </button>
      </div>

      <CtaButton
        onClick={handleAdd}
        disabled={isLoading || soldOut}
        size="lg"
        className="flex-1"
        icon={<ShoppingBag className="w-3.5 h-3.5" strokeWidth={1.25} />}
        showArrow={false}
      >
        {soldOut ? 'Sold out' : isLoading ? 'Adding…' : 'Add to Basket'}
      </CtaButton>
    </div>
    {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
    </div>
  );
};
