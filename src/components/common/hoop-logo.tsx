import React from 'react';

interface HoopLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const HoopLogo: React.FC<HoopLogoProps> = ({
  className = '',
  size = 40,
  showText = true,
}) => {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Embroidery Hoop SVG Mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-gold transition-transform duration-300 hover:rotate-6"
      >
        {/* Outer Wooden Hoop */}
        <circle cx="24" cy="26" r="18" stroke="currentColor" strokeWidth="2.5" />
        
        {/* Inner Fabric Rim */}
        <circle cx="24" cy="26" r="15.5" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" opacity="0.7" />
        
        {/* Hoop Brass Screw Hardware at Top */}
        <path d="M21 5H27V8H21V5Z" fill="currentColor" />
        <rect x="23" y="2" width="2" height="4" fill="currentColor" />
        <circle cx="20" cy="6.5" r="1" fill="currentColor" />
        <circle cx="28" cy="6.5" r="1" fill="currentColor" />

        {/* Gentle Floral Stitch Accent inside Hoop */}
        <path d="M24 16V22M24 22L20 18M24 22L28 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M24 26C24 29 21 32 18 31" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
        <path d="M24 26C24 29 27 32 30 31" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
        <circle cx="24" cy="22" r="1.5" fill="currentColor" />
      </svg>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className="font-display tracking-[0.2em] text-lg font-bold text-wine uppercase">
            HILO ARTE
          </span>
          <span className="font-accent italic text-xs tracking-wider text-antique-gold font-normal">
            slow embroidery
          </span>
        </div>
      )}
    </div>
  );
};
