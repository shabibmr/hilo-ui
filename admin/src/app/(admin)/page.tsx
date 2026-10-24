'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getDashboardCounts } from '@/lib/api';
import {
  Package,
  ShoppingBag,
  MessageSquare,
  Layers,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  PlusCircle,
  ExternalLink,
} from 'lucide-react';

interface DashboardStats {
  totalProducts: number;
  lowStockProducts: number;
  totalCollections: number;
  pendingOrders: number;
  totalOrders: number;
  unhandledEnquiries: number;
  loading: boolean;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    lowStockProducts: 0,
    totalCollections: 0,
    pendingOrders: 0,
    totalOrders: 0,
    unhandledEnquiries: 0,
    loading: true,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const counts = await getDashboardCounts();
        setStats({ ...counts, loading: false });
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setStats((prev) => ({ ...prev, loading: false }));
      }
    }

    loadStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-stone-900 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Welcome back to the Hilo Arte management portal.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/products/new"
            className="inline-flex items-center space-x-2 bg-[#380b0c] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#4d1012] transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Products */}
        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-xs hover:border-stone-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Products
            </span>
            <div className="p-2 bg-stone-100 rounded-lg text-stone-700">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-stone-900">
              {stats.loading ? '...' : stats.totalProducts}
            </div>
            {stats.lowStockProducts > 0 && (
              <div className="flex items-center space-x-1 text-xs text-amber-700 font-medium mt-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{stats.lowStockProducts} low stock</span>
              </div>
            )}
          </div>
        </div>

        {/* Collections */}
        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-xs hover:border-stone-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Collections
            </span>
            <div className="p-2 bg-stone-100 rounded-lg text-stone-700">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-stone-900">
              {stats.loading ? '...' : stats.totalCollections}
            </div>
            <p className="text-xs text-stone-400 mt-1">Active categories</p>
          </div>
        </div>

        {/* Orders */}
        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-xs hover:border-stone-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Orders
            </span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-800">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-stone-900">
              {stats.loading ? '...' : stats.totalOrders}
            </div>
            <div className="flex items-center space-x-1 text-xs text-amber-700 font-medium mt-1">
              <span>{stats.pendingOrders} pending action</span>
            </div>
          </div>
        </div>

        {/* Enquiries */}
        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-xs hover:border-stone-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Enquiries
            </span>
            <div className="p-2 bg-rose-50 rounded-lg text-rose-800">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-stone-900">
              {stats.loading ? '...' : stats.unhandledEnquiries}
            </div>
            <p className="text-xs text-stone-500 mt-1">Unhandled messages</p>
          </div>
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Catalog Section */}
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-stone-900">
            <Package className="w-5 h-5 text-[#380b0c]" />
            <h2 className="font-semibold text-base">Catalog & Inventory</h2>
          </div>
          <p className="text-sm text-stone-600 leading-relaxed">
            Manage your embroidery kits, thread sets, descriptions, pricing, and stock levels.
          </p>
          <div className="pt-2 flex flex-col space-y-2">
            <Link
              href="/products"
              className="flex items-center justify-between p-3 rounded-lg bg-stone-50 hover:bg-stone-100 text-sm font-medium text-stone-800 transition-colors"
            >
              <span>View All Products</span>
              <ArrowRight className="w-4 h-4 text-stone-400" />
            </Link>
            <Link
              href="/collections"
              className="flex items-center justify-between p-3 rounded-lg bg-stone-50 hover:bg-stone-100 text-sm font-medium text-stone-800 transition-colors"
            >
              <span>Manage Collections</span>
              <ArrowRight className="w-4 h-4 text-stone-400" />
            </Link>
          </div>
        </div>

        {/* Orders & Customers Section */}
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-stone-900">
            <ShoppingBag className="w-5 h-5 text-amber-700" />
            <h2 className="font-semibold text-base">Sales & Customers</h2>
          </div>
          <p className="text-sm text-stone-600 leading-relaxed">
            Review incoming orders, update fulfillment statuses, and manage customer contacts.
          </p>
          <div className="pt-2 flex flex-col space-y-2">
            <Link
              href="/orders"
              className="flex items-center justify-between p-3 rounded-lg bg-stone-50 hover:bg-stone-100 text-sm font-medium text-stone-800 transition-colors"
            >
              <span>View Orders</span>
              <ArrowRight className="w-4 h-4 text-stone-400" />
            </Link>
            <Link
              href="/customers"
              className="flex items-center justify-between p-3 rounded-lg bg-stone-50 hover:bg-stone-100 text-sm font-medium text-stone-800 transition-colors"
            >
              <span>Customer Directory</span>
              <ArrowRight className="w-4 h-4 text-stone-400" />
            </Link>
          </div>
        </div>

        {/* Communication & Site Settings */}
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-stone-900">
            <MessageSquare className="w-5 h-5 text-rose-700" />
            <h2 className="font-semibold text-base">Enquiries & Settings</h2>
          </div>
          <p className="text-sm text-stone-600 leading-relaxed">
            Check contact submissions, update announcement banners, store details, and social links.
          </p>
          <div className="pt-2 flex flex-col space-y-2">
            <Link
              href="/enquiries"
              className="flex items-center justify-between p-3 rounded-lg bg-stone-50 hover:bg-stone-100 text-sm font-medium text-stone-800 transition-colors"
            >
              <span>Customer Enquiries</span>
              <ArrowRight className="w-4 h-4 text-stone-400" />
            </Link>
            <Link
              href="/settings"
              className="flex items-center justify-between p-3 rounded-lg bg-stone-50 hover:bg-stone-100 text-sm font-medium text-stone-800 transition-colors"
            >
              <span>Site Configuration</span>
              <ArrowRight className="w-4 h-4 text-stone-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
