'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ImageAsset } from '@/lib/data/types';

interface ProductGalleryProps {
  images: ImageAsset[];
  productTitle: string;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({ images, productTitle }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex];

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden bg-wine/[0.03]">
        {active?.url ? (
          <Image
            src={active.url}
            alt={active.altText || productTitle}
            fill
            className="object-cover"
            priority={activeIndex === 0}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-display text-2xl text-wine/30">
            HILO ARTE
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2.5 px-3 pb-3">
          {images.map((img, idx) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setActiveIndex(idx)}
              aria-label={`View image ${idx + 1} of ${images.length}`}
              aria-current={idx === activeIndex}
              className={`relative w-16 h-16 rounded-xl overflow-hidden ring-1 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer ${
                idx === activeIndex
                  ? 'ring-gold scale-105'
                  : 'ring-wine/10 hover:ring-wine/25'
              }`}
            >
              <Image
                src={img.url}
                alt={img.altText || `${productTitle} thumbnail ${idx + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
