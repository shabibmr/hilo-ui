'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CollectionView } from '@/components/pages/collection-view';

function CollectionFromQuery() {
  const handle = useSearchParams().get('handle') || '';
  return <CollectionView handle={handle} />;
}

export default function CollectionViewPage() {
  return (
    <Suspense fallback={null}>
      <CollectionFromQuery />
    </Suspense>
  );
}
