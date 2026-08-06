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
    <div className="space-y-4">
      <div className="relative aspect-square rounded-2xl overflow-hidden border border-wine/10 bg-white shadow-wine-sm">
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
        <div className="flex gap-3">
          {images.map((img, idx) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setActiveIndex(idx)}
              aria-label={`View image ${idx + 1} of ${images.length}`}
              aria-current={idx === activeIndex}
              className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors cursor-pointer ${
                idx === activeIndex ? 'border-gold' : 'border-wine/10 hover:border-wine/30'
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
