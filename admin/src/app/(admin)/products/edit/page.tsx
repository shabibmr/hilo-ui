'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getProduct } from '@/lib/api';
import type { Product } from '@/lib/types';
import { ProductForm } from '@/components/ProductForm';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function EditProductContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('No product ID specified in query parameters.');
      setLoading(false);
      return;
    }

    async function loadProduct() {
      try {
        setProduct(await getProduct(id as string));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Product could not be loaded.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-stone-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#380b0c] mb-3" />
        <span className="text-sm font-medium">Loading product details...</span>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-xl border border-stone-200 shadow-sm text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-base font-semibold text-stone-900 mb-1">Product Not Found</h2>
        <p className="text-xs text-stone-500 mb-6">{error || 'Could not find the requested product.'}</p>
        <Link
          href="/products"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Products</span>
        </Link>
      </div>
    );
  }

  return <ProductForm initialProduct={product} isEdit={true} />;
}

export default function EditProductPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center p-20 text-stone-500">
          <Loader2 className="w-8 h-8 animate-spin text-[#380b0c] mb-3" />
          <span className="text-sm font-medium">Loading editor...</span>
        </div>
      }
    >
      <EditProductContent />
    </Suspense>
  );
}
