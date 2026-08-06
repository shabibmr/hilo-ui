import React from 'react';

export const PromoBar: React.FC = () => {
  return (
    <div className="relative z-40 bg-wine-ink text-antique-gold py-2 px-4 text-center text-[10px] tracking-[0.18em] uppercase font-body font-medium w-full">
      <div className="flex items-center justify-center gap-2">
        <span className="inline-block w-1 h-1 rounded-full bg-gold" />
        <span>Complimentary Express Shipping across India on orders over ₹1499</span>
        <span className="inline-block w-1 h-1 rounded-full bg-gold" />
      </div>
    </div>
  );
};
