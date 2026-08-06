import React from 'react';

export const PromoBar: React.FC = () => {
  return (
    <div className="bg-deep-wine text-antique-gold py-2 px-4 text-center text-xs tracking-widest uppercase font-body font-medium border-b border-gold/20 w-full">
      <div className="flex items-center justify-center gap-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
        <span>Complimentary Express Shipping across India on orders over ₹1499</span>
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
      </div>
    </div>
  );
};
