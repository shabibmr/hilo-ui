'use client';

import React from 'react';
import { useSiteSettings } from '@/lib/data/use-live';
import { DataErrorState } from '@/components/common/error-retry';

interface PromoBarProps {
  initialAnnouncement?: string | null;
}

export const PromoBar: React.FC<PromoBarProps> = ({ initialAnnouncement }) => {
  const { settings, error, reload } = useSiteSettings();

  if (error) {
    return (
      <div className="relative z-40 bg-cream-warm py-2 px-4 w-full">
        <DataErrorState
          title="Unable to load announcement"
          message={error}
          onRetry={reload}
          className="my-2 p-4 max-w-xl"
        />
      </div>
    );
  }

  // Nothing is shown until live settings arrive (or the caller supplies text), so a
  // cleared announcement never flashes and a failed load shows no stale offer.
  const announcement = (settings ? settings.announcement : initialAnnouncement)?.trim();
  if (!announcement) return null;

  return (
    <div className="relative z-40 bg-wine-ink text-antique-gold py-2 px-4 text-center text-[10px] tracking-[0.18em] uppercase font-body font-medium w-full transition-opacity duration-300">
      <div className="flex items-center justify-center gap-2">
        <span className="inline-block w-1 h-1 rounded-full bg-gold" />
        <span>{announcement}</span>
        <span className="inline-block w-1 h-1 rounded-full bg-gold" />
      </div>
    </div>
  );
};
