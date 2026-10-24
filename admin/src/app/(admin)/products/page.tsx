'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  deleteProduct,
  listCollections,
  listProducts,
  setProductPublished,
} from '@/lib/api';
import type { Product, Collection } from '@/lib/types';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Filter,
} from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  const fetchCatalog = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prods, cols] = await Promise.all([listProducts(), listCollections('title')]);
      setProducts(prods);
      setCollections(cols);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch catalog.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const togglePublish = async (prod: Product) => {
    setError(null);
    try {
      const nextState = !prod.published;
      await setProductPublished(prod.id, nextState);
      setProducts((prev) =>
        prev.map((p) => (p.id === prod.id ? { ...p, published: nextState } : p))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update published status.');
    }
  };

  const handleDelete = async (prod: Product) => {
    if (!confirm(`Are you sure you want to delete product "${prod.title}"?`)) return;

    setError(null);
    try {
      await deleteProduct(prod.id);
      setProducts((prev) => prev.filter((p) => p.id !== prod.id));
      setSuccessMsg(`Product "${prod.title}" deleted.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed.';
      setError(`Error deleting product: ${msg}`);
    }
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.handle.toLowerCase().includes(search.toLowerCase()) ||
      p.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()));

    const matchesCollection =
      selectedCollection === 'all' || p.collections?.includes(selectedCollection);

    const matchesStock =
      stockFilter === 'all'
        ? true
        : stockFilter === 'in_stock'
        ? p.stock > 3
        : stockFilter === 'low_stock'
        ? p.stock > 0 && p.stock <= 3
        : p.stock <= 0;

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'published'
        ? p.published
        : !p.published;

    return matchesSearch && matchesCollection && matchesStock && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Notifications */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-2 text-emerald-800 text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center space-x-2 text-rose-800 text-sm">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-stone-900">Products</h1>
          <p className="text-sm text-stone-500 mt-1">
            Manage your embroidery kits, pricing, inventory stock, and descriptions.
          </p>
        </div>
        <Link
          href="/products/new"
          className="inline-flex items-center space-x-2 bg-[#380b0c] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#4d1012] transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Product</span>
        </Link>
      </div>

      {/* Filters & Search Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search by title, handle, or tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#380b0c]"
            />
          </div>

          {/* Collection Filter */}
          <select
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
            className="px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none"
          >
            <option value="all">All Collections</option>
            {collections.map((c) => (
              <option key={c.id} value={c.handle}>
                {c.title}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as 'all' | 'in_stock' | 'low_stock' | 'out_of_stock')}
            className="px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none"
          >
            <option value="all">All Stock Levels</option>
            <option value="in_stock">In Stock (&gt;3)</option>
            <option value="low_stock">Low Stock (1-3)</option>
            <option value="out_of_stock">Out of Stock (0)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'published' | 'draft')}
            className="px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 text-stone-500">
          <Loader2 className="w-7 h-7 animate-spin text-[#380b0c] mb-2" />
          <span className="text-sm">Loading products catalog...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
          <Package className="w-10 h-10 text-stone-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-stone-800">No products found</h3>
          <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">
            {search || selectedCollection !== 'all' || stockFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your filters.'
              : 'Add your first product to get started.'}
          </p>
          <Link
            href="/products/new"
            className="mt-4 inline-flex items-center space-x-2 text-xs font-semibold text-[#380b0c] bg-stone-100 hover:bg-stone-200 px-3.5 py-2 rounded-lg transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
              <thead className="bg-stone-50 text-stone-600 uppercase text-[11px] font-semibold tracking-wider">
                <tr>
                  <th scope="col" className="px-5 py-3">Product</th>
                  <th scope="col" className="px-5 py-3">Price</th>
                  <th scope="col" className="px-5 py-3">Stock</th>
                  <th scope="col" className="px-5 py-3">Difficulty</th>
                  <th scope="col" className="px-5 py-3">Collections</th>
                  <th scope="col" className="px-5 py-3 text-center">Status</th>
                  <th scope="col" className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredProducts.map((p) => {
                  const primaryImg = p.images?.[0]?.url;

                  return (
                    <tr key={p.id} className="hover:bg-stone-50/70 transition-colors">
                      {/* Product details */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-lg bg-stone-100 border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {primaryImg ? (
                              <img
                                src={primaryImg}
                                alt={p.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-5 h-5 text-stone-400" />
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <Link
                              href={`/products/edit/?id=${p.id}`}
                              className="font-medium text-stone-900 hover:text-[#380b0c] truncate block"
                            >
                              {p.title}
                            </Link>
                            <span className="text-xs text-stone-400 font-mono">
                              /{p.handle}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-5 py-3.5 font-medium text-stone-900 whitespace-nowrap">
                        ₹{Number(p.price).toLocaleString('en-IN')}
                      </td>

                      {/* Stock badge */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            p.stock > 3
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : p.stock > 0
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {p.stock > 3
                            ? `${p.stock} in stock`
                            : p.stock > 0
                            ? `${p.stock} low stock`
                            : 'Sold out'}
                        </span>
                      </td>

                      {/* Difficulty */}
                      <td className="px-5 py-3.5 text-xs text-stone-600 whitespace-nowrap">
                        {p.difficulty} ({p.estimated_hours}h)
                      </td>

                      {/* Collections */}
                      <td className="px-5 py-3.5 text-xs text-stone-500 max-w-[160px] truncate">
                        {p.collections && p.collections.length > 0
                          ? p.collections.join(', ')
                          : 'None'}
                      </td>

                      {/* Published Toggle */}
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => togglePublish(p)}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition ${
                            p.published
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                          }`}
                        >
                          {p.published ? 'Published' : 'Draft'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          {p.published ? (
                            <a
                              href={`/hilo/products/${p.handle}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="View on Storefront (products added since the last storefront build won't load until it is rebuilt)"
                              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-md hover:bg-stone-100"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <span
                              title="Publish this product to view it on the storefront"
                              className="p-1.5 text-stone-300 cursor-not-allowed"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </span>
                          )}
                          <Link
                            href={`/products/edit/?id=${p.id}`}
                            title="Edit Product"
                            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-md hover:bg-stone-100"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(p)}
                            title="Delete Product"
                            className="p-1.5 text-rose-400 hover:text-rose-700 rounded-md hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
