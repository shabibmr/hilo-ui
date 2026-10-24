'use client';

import React from 'react';
import { ProductForm } from '@/components/ProductForm';

export default function NewProductPage() {
  return (
    <div>
      <ProductForm isEdit={false} />
    </div>
  );
}
