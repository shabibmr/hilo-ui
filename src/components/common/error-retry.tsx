'use client';

import React from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface DataErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const DataErrorState: React.FC<DataErrorStateProps> = ({
  title = 'Unable to connect to studio catalog',
  message = 'We experienced an issue reaching our live catalog. Please check your connection and retry.',
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`p-10 rounded-2xl bg-white/70 backdrop-blur-xs ring-1 ring-wine/10 text-center max-w-md mx-auto my-12 space-y-4 shadow-wine-sm ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-wine/5 ring-1 ring-wine/10 flex items-center justify-center mx-auto text-wine">
        <AlertCircle className="w-6 h-6 text-gold" />
      </div>

      <div>
        <h3 className="font-display text-xl text-wine font-medium">{title}</h3>
        <p className="text-xs text-wine/70 font-light mt-1.5 leading-relaxed">
          {message}
        </p>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-deep-wine text-antique-gold hover:bg-wine text-xs uppercase tracking-[0.14em] font-medium transition-colors ring-1 ring-gold/30 shadow-wine-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Connection</span>
        </button>
      )}
    </div>
  );
};
