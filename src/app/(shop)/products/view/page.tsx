'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductView } from '@/components/pages/product-view';

function ProductFromQuery() {
  const handle = useSearchParams().get('handle') || '';
  return <ProductView handle={handle} />;
}

export default function ProductViewPage() {
  return (
    <Suspense fallback={null}>
      <ProductFromQuery />
    </Suspense>
  );
}
