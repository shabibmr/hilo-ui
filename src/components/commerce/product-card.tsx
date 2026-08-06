'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/lib/data/types';
import { useCartStore } from '@/lib/cart/cart-store';
import { ShoppingBag, Clock } from 'lucide-react';
import { DoubleBezel } from '../common/double-bezel';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem, isLoading } = useCartStore();

  return (
    <div className="group relative flex flex-col h-full transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1.5">
      <DoubleBezel className="h-full shadow-wine-sm" coreClassName="flex flex-col h-full bg-white">
        <Link
          href={`/products/${product.handle}`}
          className="block relative aspect-[4/5] overflow-hidden bg-wine/[0.04]"
        >
          {product.images[0]?.url ? (
            <Image
              src={product.images[0].url}
              alt={product.title}
              fill
              className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-wine/30 font-display text-lg">
              HILO ARTE
            </div>
          )}

          <div className="absolute top-3 left-3 right-3 flex justify-between items-start pointer-events-none">
            <span className="bg-deep-wine/90 text-antique-gold font-body text-[9px] uppercase tracking-[0.14em] font-semibold px-3 py-1 rounded-full ring-1 ring-gold/30">
              {product.difficulty}
            </span>
            <span className="bg-cream-warm/95 text-wine font-body text-[9px] uppercase tracking-[0.14em] font-semibold px-2.5 py-1 rounded-full ring-1 ring-wine/10 flex items-center gap-1">
              <Clock className="w-3 h-3 text-gold" strokeWidth={1.25} />
              {product.estimatedHours} hrs
            </span>
          </div>
        </Link>

        <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
          <div>
            <Link
              href={`/products/${product.handle}`}
              className="block group-hover:text-gold transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
            >
              <h3 className="font-display text-xl font-medium text-wine leading-tight">
                {product.title}
              </h3>
            </Link>
            <p className="font-accent italic text-sm text-wine/55 mt-1 line-clamp-1">
              {product.subtitle || product.shortDescription}
            </p>
          </div>

          <div className="flex items-center justify-between pt-3 ring-1 ring-inset ring-transparent border-t border-wine/5">
            <div>
              <span className="text-[10px] text-wine/45 block font-medium tracking-[0.12em] uppercase">
                Price
              </span>
              <span className="font-display text-lg font-medium text-wine">₹{product.price}</span>
            </div>

            <button
              onClick={() => addItem(product)}
              disabled={isLoading}
              className="group/btn inline-flex items-center gap-2 bg-gold text-wine hover:bg-antique-gold pl-4 pr-1.5 py-1.5 rounded-full font-body text-[10px] uppercase tracking-[0.12em] font-semibold transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              Add
              <span className="w-8 h-8 rounded-full bg-wine/10 flex items-center justify-center transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-px group-hover/btn:scale-105">
                <ShoppingBag className="w-3.5 h-3.5" strokeWidth={1.25} />
              </span>
            </button>
          </div>
        </div>
      </DoubleBezel>
    </div>
  );
};
