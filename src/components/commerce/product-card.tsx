'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/lib/data/types';
import { useCartStore } from '@/lib/cart/cart-store';
import { ShoppingBag, Clock } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem, isLoading } = useCartStore();

  return (
    <div className="group relative bg-white/70 backdrop-blur-sm rounded-xl overflow-hidden border border-wine/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-gold-glow flex flex-col h-full">
      {/* Image Container */}
      <Link href={`/products/${product.handle}`} className="block relative aspect-[4/5] overflow-hidden bg-wine/5">
        {product.images[0]?.url ? (
          <Image
            src={product.images[0].url}
            alt={product.title}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-wine/30 font-display text-lg">
            HILO ARTE
          </div>
        )}

        {/* Difficulty Badge */}
        <div className="absolute top-3 left-3 bg-deep-wine/90 backdrop-blur-md text-antique-gold font-body text-[10px] uppercase tracking-wider px-3 py-1 rounded-full border border-gold/30">
          {product.difficulty}
        </div>

        {/* Hours Badge */}
        <div className="absolute top-3 right-3 bg-cream/90 backdrop-blur-md text-wine font-body text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border border-wine/10 flex items-center gap-1">
          <Clock className="w-3 h-3 text-gold" />
          <span>{product.estimatedHours} hrs</span>
        </div>
      </Link>

      {/* Card Content */}
      <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
        <div>
          <Link href={`/products/${product.handle}`} className="block group-hover:text-gold transition-colors">
            <h3 className="font-display text-xl font-medium text-wine leading-tight">
              {product.title}
            </h3>
          </Link>
          <p className="font-accent italic text-xs text-wine/60 mt-1 line-clamp-1">
            {product.subtitle || product.shortDescription}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-wine/10">
          <div>
            <span className="text-xs text-wine/50 block font-light">Price</span>
            <span className="font-display text-lg font-semibold text-wine">₹{product.price}</span>
          </div>

          <button
            onClick={() => addItem(product)}
            disabled={isLoading}
            className="bg-gold text-wine hover:bg-antique-gold px-4 py-2 rounded-md font-body text-xs uppercase tracking-wider font-semibold transition-colors flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
};
