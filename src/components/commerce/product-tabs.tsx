'use client';

import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ProductTabsProps {
  description: string;
  whatsIncluded: string[];
  shippingInfo: string;
  faqs: { question: string; answer: string }[];
}

const TABS = [
  { key: 'description', label: 'Description' },
  { key: 'included', label: "What's Included" },
  { key: 'shipping', label: 'Shipping' },
  { key: 'faq', label: 'FAQ' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export const ProductTabs: React.FC<ProductTabsProps> = ({
  description,
  whatsIncluded,
  shippingInfo,
  faqs,
}) => {
  const [active, setActive] = useState<TabKey>('description');

  return (
    <div className="bg-white/80 rounded-[1.5rem] ring-1 ring-wine/5 overflow-hidden">
      <div
        role="tablist"
        aria-label="Product information"
        className="flex border-b border-wine/5 overflow-x-auto"
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            id={`tab-${tab.key}`}
            aria-selected={active === tab.key}
            aria-controls={`panel-${tab.key}`}
            onClick={() => setActive(tab.key)}
            className={`px-4 py-3 text-[10px] uppercase tracking-[0.14em] font-semibold whitespace-nowrap transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer ${
              active === tab.key
                ? 'text-wine border-b-2 border-gold'
                : 'text-wine/50 hover:text-wine/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {active === 'description' && (
          <div id="panel-description" role="tabpanel" aria-labelledby="tab-description">
            <p className="font-body text-sm text-wine/75 leading-relaxed font-light">
              {description}
            </p>
          </div>
        )}

        {active === 'included' && (
          <ul
            id="panel-included"
            role="tabpanel"
            aria-labelledby="tab-included"
            className="space-y-2"
          >
            {whatsIncluded.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-wine/75 font-light">
                <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" strokeWidth={1.25} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}

        {active === 'shipping' && (
          <div id="panel-shipping" role="tabpanel" aria-labelledby="tab-shipping">
            <p className="font-body text-sm text-wine/75 leading-relaxed font-light">
              {shippingInfo}
            </p>
          </div>
        )}

        {active === 'faq' && (
          <div id="panel-faq" role="tabpanel" aria-labelledby="tab-faq" className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx}>
                <p className="font-display text-sm font-medium text-wine">{faq.question}</p>
                <p className="font-body text-xs text-wine/65 font-light mt-1">{faq.answer}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
