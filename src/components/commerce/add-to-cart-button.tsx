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
  const { addItem, isLoading } = useCartStore();

  const handleAdd = () => {
    addItem(product, product.variants[0], quantity);
  };

  return (
    <div className="flex items-center gap-4">
      {/* Quantity Stepper */}
      <div className="flex items-center border border-wine/20 rounded-md bg-white px-2 py-2">
        <button
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          className="p-1 text-wine/60 hover:text-wine cursor-pointer"
          aria-label="Decrease quantity"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-8 text-center font-semibold text-sm">{quantity}</span>
        <button
          onClick={() => setQuantity(quantity + 1)}
          className="p-1 text-wine/60 hover:text-wine cursor-pointer"
          aria-label="Increase quantity"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Add Button */}
      <CtaButton onClick={handleAdd} disabled={isLoading} size="lg" className="flex-1">
        <ShoppingBag className="w-4 h-4 mr-2" />
        {isLoading ? 'Adding...' : 'Add to Basket'}
      </CtaButton>
    </div>
  );
};
