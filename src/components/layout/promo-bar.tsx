'use client';

import React, { useEffect, useState } from 'react';
import { contentRepository } from '@/lib/data/providers';

interface PromoBarProps {
  initialAnnouncement?: string | null;
}

export const PromoBar: React.FC<PromoBarProps> = ({ initialAnnouncement }) => {
  const [announcement, setAnnouncement] = useState<string | null>(
    initialAnnouncement !== undefined
      ? initialAnnouncement
      : 'Complimentary Express Shipping across India on orders over ₹1499'
  );
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let active = true;
    contentRepository
      .getSiteSettings()
      .then((settings) => {
        if (!active) return;
        if (settings.announcement !== undefined) {
          if (!settings.announcement || !settings.announcement.trim()) {
            setVisible(false);
          } else {
            setAnnouncement(settings.announcement);
            setVisible(true);
          }
        }
      })
      .catch((err) => {
        console.warn('Could not load announcement settings:', err);
      });

    return () => {
      active = false;
    };
  }, []);

  if (!visible || !announcement) return null;

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
