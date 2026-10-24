'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Order, OrderItem, OrderStatus, StoreProfile } from '@/lib/types';
import {
  getOrderBundle,
  getSiteSettings,
  listOrders,
  refundOrder,
  releasePendingHold,
  updateOrderStatus,
  verifyPayment,
  type OrderBundle,
} from '@/lib/api';
import { inr, ORDER_STATUSES, statusLabel, timeAgo, when, whenTime } from '@/lib/format';
import { InvoiceModal } from '@/components/InvoiceModal';
import {
  ShoppingBag,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  Truck,
  PackageCheck,
  XCircle,
  Eye,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  RefreshCw,
  Printer,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  FileText,
  X,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

function getStatusBadge(status: OrderStatus) {
  switch (status) {
    case 'pending':
      return {
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        dot: 'bg-amber-500',
        icon: Clock,
        label: 'Pending Payment',
      };
    case 'paid':
      return {
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        dot: 'bg-emerald-500',
        icon: CheckCircle2,
        label: 'Paid',
      };
    case 'shipped':
      return {
        bg: 'bg-sky-50 text-sky-800 border-sky-200',
        dot: 'bg-sky-500',
        icon: Truck,
        label: 'Shipped',
      };
    case 'delivered':
      return {
        bg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
        dot: 'bg-indigo-500',
        icon: PackageCheck,
        label: 'Delivered',
      };
    case 'cancelled':
      return {
        bg: 'bg-rose-50 text-rose-800 border-rose-200',
        dot: 'bg-rose-500',
        icon: XCircle,
        label: 'Cancelled',
      };
    case 'refunded':
      return {
        bg: 'bg-purple-50 text-purple-800 border-purple-200',
        dot: 'bg-purple-500',
        icon: RotateCcw,
        label: 'Refunded',
      };
    default:
      return {
        bg: 'bg-stone-100 text-stone-700 border-stone-200',
        dot: 'bg-stone-400',
        icon: Clock,
        label: status,
      };
  }
}

function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedOrderIdFromUrl = searchParams.get('id');

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Selected Order Drawer / Modal
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(selectedOrderIdFromUrl);
  const [drawerBundle, setDrawerBundle] = useState<OrderBundle | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [store, setStore] = useState<StoreProfile | null>(null);

  // Seller details printed on invoices come from Site Settings.
  useEffect(() => {
    getSiteSettings()
      .then((s) => setStore(s.store))
      .catch(() => setStore(null));
  }, []);

  // Re-read the open order so status, invoice number and totals match the database.
  const refreshBundle = async (orderId: string) => {
    if (drawerBundle?.order.id !== orderId) return;
    setDrawerBundle(await getOrderBundle(orderId));
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listOrders();
      setOrders(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch orders.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Sync selected order from URL or state
  useEffect(() => {
    if (selectedOrderIdFromUrl) {
      setSelectedOrderId(selectedOrderIdFromUrl);
    }
  }, [selectedOrderIdFromUrl]);

  // Load bundle when drawer opens
  useEffect(() => {
    if (!selectedOrderId) {
      setDrawerBundle(null);
      return;
    }

    let active = true;
    setDrawerLoading(true);
    setDrawerError(null);
    setActionSuccess(null);

    getOrderBundle(selectedOrderId)
      .then((bundle) => {
        if (active) setDrawerBundle(bundle);
      })
      .catch((err: unknown) => {
        if (active) {
          const msg = err instanceof Error ? err.message : 'Failed to load order details.';
          setDrawerError(msg);
        }
      })
      .finally(() => {
        if (active) setDrawerLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedOrderId]);

  // Handle Quick Status Change
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (targetOrder?.status === 'refunded') {
      alert('A refunded order cannot be transitioned to another status.');
      return;
    }
    if (
      targetOrder?.razorpay_payment_id &&
      ['paid', 'shipped', 'delivered'].includes(targetOrder.status) &&
      (newStatus === 'pending' || newStatus === 'cancelled')
    ) {
      alert('This order has a captured Razorpay payment. Use "Issue Refund" instead of cancelling or reverting it.');
      return;
    }
    if (newStatus === 'refunded') {
      alert('Please use the "Issue Refund" button in the order details to process a refund with Razorpay and restore inventory.');
      return;
    }

    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      // Update local orders list
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      await refreshBundle(orderId);
      setActionSuccess(`Order status updated to "${statusLabel(newStatus)}"`);
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update order status.';
      alert(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle Verify Payment with Razorpay
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const handleVerifyPayment = async (orderId: string) => {
    setVerifyingId(orderId);
    try {
      const res = await verifyPayment(orderId);
      if (res.verified) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: res.status } : o))
        );
        await refreshBundle(orderId);
        setActionSuccess(res.message);
      } else {
        alert(res.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to verify payment.';
      alert(msg);
    } finally {
      setVerifyingId(null);
    }
  };

  // Handle Full Refund
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const handleRefundOrder = async (orderId: string) => {
    if (!drawerBundle) return;
    const confirmed = confirm(
      `Issue full refund of ${inr(drawerBundle.order.subtotal)} for Order #${orderId.slice(
        0,
        10
      )}?\n\nThis will trigger a Razorpay refund and restore kit stock to inventory.`
    );
    if (!confirmed) return;

    setRefundingId(orderId);
    try {
      await refundOrder(orderId);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'refunded' } : o))
      );
      const updated = await getOrderBundle(orderId);
      setDrawerBundle(updated);
      setActionSuccess('Order refunded successfully and inventory restocked.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to process refund.';
      alert(msg);
    } finally {
      setRefundingId(null);
    }
  };

  // Handle Release Stock Hold
  const handleReleaseHold = async (orderId: string) => {
    try {
      await releasePendingHold(orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } : o)));
      setActionSuccess('Order cancelled and stock hold released.');
      await refreshBundle(orderId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to release hold.';
      alert(msg);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const openDrawer = (orderId: string) => {
    setSelectedOrderId(orderId);
    router.push(`/orders?id=${orderId}`, { scroll: false });
  };

  const closeDrawer = () => {
    setSelectedOrderId(null);
    setDrawerBundle(null);
    router.push('/orders', { scroll: false });
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === 'all' ? true : order.status === statusFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        order.id.toLowerCase().includes(q) ||
        order.customer_name.toLowerCase().includes(q) ||
        order.customer_email.toLowerCase().includes(q) ||
        (order.customer_phone && order.customer_phone.toLowerCase().includes(q)) ||
        (order.razorpay_order_id && order.razorpay_order_id.toLowerCase().includes(q)) ||
        (order.razorpay_payment_id && order.razorpay_payment_id.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, searchQuery]);

  // Aggregate stats
  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === 'pending').length;
    const paid = orders.filter((o) => o.status === 'paid').length;
    const shipped = orders.filter((o) => o.status === 'shipped').length;
    const delivered = orders.filter((o) => o.status === 'delivered').length;
    const refunded = orders.filter((o) => o.status === 'refunded').length;
    const revenue = orders
      .filter((o) => ['paid', 'shipped', 'delivered'].includes(o.status))
      .reduce((acc, curr) => acc + (Number(curr.subtotal) || 0), 0);

    return { total, pending, paid, shipped, delivered, refunded, revenue };
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-stone-900 tracking-tight">
            Orders
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Review customer orders, verify payment, and manage fulfillment.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="inline-flex items-center space-x-2 border border-stone-200 bg-white px-3.5 py-2 rounded-lg text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors shadow-2xs"
            title="Refresh orders list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Total Orders
          </div>
          <div className="text-2xl font-bold text-stone-900 mt-1.5">{stats.total}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-2xs bg-amber-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
              Pending
            </span>
            {stats.pending > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </div>
          <div className="text-2xl font-bold text-amber-900 mt-1.5">{stats.pending}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200/80 shadow-2xs bg-emerald-50/20">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
            Paid
          </div>
          <div className="text-2xl font-bold text-emerald-900 mt-1.5">{stats.paid}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-sky-200/80 shadow-2xs bg-sky-50/20">
          <div className="text-xs font-semibold uppercase tracking-wider text-sky-800">
            Shipped / Out
          </div>
          <div className="text-2xl font-bold text-sky-900 mt-1.5">
            {stats.shipped + stats.delivered}
          </div>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Realized Revenue
          </div>
          <div className="text-xl sm:text-2xl font-bold text-stone-900 mt-1.5">
            {inr(stats.revenue)}
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center overflow-x-auto pb-1 md:pb-0 gap-1.5 text-xs font-medium scrollbar-none">
            {[
              { id: 'all', label: 'All Orders', count: stats.total },
              { id: 'pending', label: 'Pending', count: stats.pending },
              { id: 'paid', label: 'Paid', count: stats.paid },
              { id: 'shipped', label: 'Shipped', count: stats.shipped },
              { id: 'delivered', label: 'Delivered', count: stats.delivered },
              { id: 'refunded', label: 'Refunded', count: stats.refunded },
              {
                id: 'cancelled',
                label: 'Cancelled',
                count: orders.filter((o) => o.status === 'cancelled').length,
              },
            ].map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`inline-flex items-center px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-stone-900 text-white font-semibold'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${
                      active ? 'bg-stone-700 text-white' : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search order ID, customer, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-stone-400 focus:bg-white transition-all placeholder:text-stone-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-stone-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-stone-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-stone-400 mb-3" />
            <p className="text-sm">Loading orders catalog...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
            <p className="text-sm text-stone-700 font-medium">Failed to load orders</p>
            <p className="text-xs text-rose-600 mt-1">{error}</p>
            <button
              onClick={fetchOrders}
              className="mt-4 px-4 py-1.5 bg-stone-900 text-white text-xs font-medium rounded-lg hover:bg-stone-800"
            >
              Retry
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-16 text-center text-stone-500">
            <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <p className="text-base font-medium text-stone-800">No orders found</p>
            <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all'
                ? 'Try resetting your search query or status filter.'
                : 'Customer orders placed on the storefront will appear here.'}
            </p>
            {(searchQuery || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="mt-4 px-3 py-1.5 border border-stone-200 text-xs font-medium rounded-lg hover:bg-stone-50 text-stone-700"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-700">
              <thead className="bg-stone-50/80 border-b border-stone-200 text-xs font-semibold uppercase tracking-wider text-stone-500">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Order</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Destination</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredOrders.map((order) => {
                  const badge = getStatusBadge(order.status);
                  const BadgeIcon = badge.icon;
                  const isPending = order.status === 'pending';

                  return (
                    <tr
                      key={order.id}
                      onClick={() => openDrawer(order.id)}
                      className="hover:bg-amber-50/30 transition-colors cursor-pointer group"
                    >
                      {/* Order ID & Date */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-stone-900 group-hover:text-amber-900 transition-colors">
                            #{order.id.slice(0, 10)}
                          </span>
                          {isPending && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800">
                              Hold active
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-stone-500 mt-0.5 flex items-center space-x-1.5">
                          <span>{timeAgo(order.created_at)}</span>
                          <span>•</span>
                          <span>{when(order.created_at)}</span>
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="py-4 px-4">
                        <div className="font-medium text-stone-900">
                          {order.customer_name}
                        </div>
                        <div className="text-xs text-stone-500 truncate max-w-[180px]">
                          {order.customer_email}
                        </div>
                      </td>

                      {/* Destination */}
                      <td className="py-4 px-4 text-xs text-stone-600">
                        <div>
                          {order.shipping_address?.city || '—'},{' '}
                          {order.shipping_address?.state || ''}
                        </div>
                        <div className="text-[11px] text-stone-400">
                          {order.shipping_address?.postalCode || ''}
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-stone-900">
                          {inr(order.subtotal)}
                        </div>
                        <div className="text-[11px] text-stone-400">
                          {order.currency_code}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block text-left">
                          <select
                            value={order.status}
                            disabled={updatingId === order.id}
                            onChange={(e) =>
                              handleStatusChange(order.id, e.target.value as OrderStatus)
                            }
                            className={`text-xs font-medium pl-2.5 pr-7 py-1 rounded-full border appearance-none transition-colors cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-stone-400 ${badge.bg}`}
                          >
                            {ORDER_STATUSES.map((st) => (
                              <option key={st} value={st}>
                                {statusLabel(st)}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-stone-600">
                            {updatingId === order.id ? (
                              <Loader2 className="w-3 h-3 animate-spin text-stone-600" />
                            ) : (
                              <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDrawer(order.id);
                          }}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-over Order Detail Drawer */}
      {selectedOrderId && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={closeDrawer}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col border-l border-stone-200 animate-in slide-in-from-right duration-250 ease-out">
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-stone-200 bg-stone-50/70 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-lg font-bold font-serif text-stone-900">
                      Order #{selectedOrderId.slice(0, 12)}
                    </h2>
                    {drawerBundle && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                          getStatusBadge(drawerBundle.order.status).bg
                        }`}
                      >
                        {statusLabel(drawerBundle.order.status)}
                      </span>
                    )}
                  </div>
                  {drawerBundle && (
                    <p className="text-xs text-stone-500 mt-0.5 flex items-center space-x-2">
                      <Clock className="w-3 h-3" />
                      <span>Placed on {whenTime(drawerBundle.order.created_at)}</span>
                      <span>({timeAgo(drawerBundle.order.created_at)})</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setInvoiceOpen(true)}
                    disabled={!drawerBundle?.invoice}
                    className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title={drawerBundle?.invoice ? 'View Tax Invoice' : 'No invoice yet. One is issued when the order is paid.'}
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={closeDrawer}
                    className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Action Feedback Banner */}
              {actionSuccess && (
                <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{actionSuccess}</span>
                  </div>
                  <button
                    onClick={() => setActionSuccess(null)}
                    className="text-emerald-700 hover:text-emerald-900"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {drawerLoading ? (
                  <div className="py-24 text-center text-stone-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-stone-400 mb-3" />
                    <p className="text-sm">Fetching complete order details...</p>
                  </div>
                ) : drawerError ? (
                  <div className="py-12 text-center">
                    <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                    <p className="text-sm text-stone-800 font-medium">{drawerError}</p>
                    <button
                      onClick={() => {
                        if (selectedOrderId) {
                          setDrawerLoading(true);
                          setDrawerError(null);
                          getOrderBundle(selectedOrderId)
                            .then(setDrawerBundle)
                            .catch((err: unknown) =>
                              setDrawerError(err instanceof Error ? err.message : 'Failed to load order details.')
                            )
                            .finally(() => setDrawerLoading(false));
                        }
                      }}
                      className="mt-3 px-3 py-1 bg-stone-900 text-white text-xs rounded-md"
                    >
                      Retry
                    </button>
                  </div>
                ) : drawerBundle ? (
                  <>
                    {/* Status Changer Bar */}
                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600">
                          Fulfillment Status
                        </label>
                        {['paid', 'shipped', 'delivered'].includes(drawerBundle.order.status) && (
                          <button
                            type="button"
                            disabled={refundingId === drawerBundle.order.id}
                            onClick={() => handleRefundOrder(drawerBundle.order.id)}
                            className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-[11px] font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors"
                          >
                            <RotateCcw
                              className={`w-3 h-3 ${
                                refundingId === drawerBundle.order.id ? 'animate-spin' : ''
                              }`}
                            />
                            <span>
                              {refundingId === drawerBundle.order.id
                                ? 'Refunding...'
                                : 'Issue Full Refund'}
                            </span>
                          </button>
                        )}
                      </div>

                      {drawerBundle.order.status === 'refunded' ? (
                        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-900 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <RotateCcw className="w-4 h-4 text-purple-600" />
                            <div>
                              <span className="font-semibold">Refunded Order:</span> Returned
                              to inventory.
                              {drawerBundle.order.refund_id && (
                                <div className="text-[11px] font-mono text-purple-700 mt-0.5">
                                  Ref ID: {drawerBundle.order.refund_id}
                                </div>
                              )}
                            </div>
                          </div>
                          {drawerBundle.order.refunded_at && (
                            <span className="text-[11px] text-purple-700">
                              {when(drawerBundle.order.refunded_at)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-5 gap-1.5">
                          {ORDER_STATUSES.filter((st) => st !== 'refunded').map((status) => {
                            const active = drawerBundle.order.status === status;
                            const isPendingDisabled =
                              status === 'pending' &&
                              Boolean(drawerBundle.order.razorpay_payment_id);

                            return (
                              <button
                                key={status}
                                disabled={
                                  updatingId === drawerBundle.order.id || isPendingDisabled
                                }
                                onClick={() =>
                                  handleStatusChange(drawerBundle.order.id, status)
                                }
                                title={
                                  isPendingDisabled
                                    ? 'Cannot set captured payment back to pending'
                                    : undefined
                                }
                                className={`py-1.5 px-2 text-xs font-medium rounded-lg text-center transition-all ${
                                  active
                                    ? 'bg-stone-900 text-white shadow-xs font-semibold'
                                    : isPendingDisabled
                                    ? 'bg-stone-100 text-stone-300 border border-stone-200 cursor-not-allowed'
                                    : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                                }`}
                              >
                                {statusLabel(status)}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Pending Stock Hold & Razorpay Verification */}
                    {drawerBundle.order.status === 'pending' && (
                      <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-4 space-y-3">
                        <div className="flex items-start space-x-2.5">
                          <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                          <div className="text-xs text-amber-900 leading-relaxed">
                            <span className="font-semibold">Stock Reservation Active:</span>{' '}
                            Reserving items from inventory. Unpaid orders release stock
                            after 15 minutes.
                          </div>
                        </div>

                        {drawerBundle.holdExpiresAt && (
                          <div className="text-[11px] text-amber-800 pl-6.5">
                            Hold target:{' '}
                            <span className="font-medium">
                              {whenTime(drawerBundle.holdExpiresAt)}
                            </span>
                          </div>
                        )}

                        <div className="pt-1 pl-6.5 flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            disabled={verifyingId === drawerBundle.order.id}
                            onClick={() => handleVerifyPayment(drawerBundle.order.id)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-800 text-white rounded-lg text-xs font-medium hover:bg-amber-900 transition-colors shadow-2xs disabled:opacity-50"
                          >
                            <RefreshCw
                              className={`w-3.5 h-3.5 ${
                                verifyingId === drawerBundle.order.id ? 'animate-spin' : ''
                              }`}
                            />
                            <span>
                              {verifyingId === drawerBundle.order.id
                                ? 'Checking Razorpay...'
                                : 'Verify with Razorpay'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleReleaseHold(drawerBundle.order.id)}
                            className="text-xs font-medium text-amber-900 underline hover:text-amber-950"
                          >
                            Cancel order &amp; release stock hold
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Order Items Table */}
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
                        Ordered Items ({drawerBundle.items.length})
                      </h3>
                      <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100">
                        {drawerBundle.items.map((item: OrderItem) => (
                          <div
                            key={item.id}
                            className="p-3.5 flex items-center justify-between text-sm hover:bg-stone-50/50"
                          >
                            <div className="flex-1 pr-4">
                              <div className="font-medium text-stone-900">
                                {item.title}
                              </div>
                              <div className="text-xs text-stone-500 mt-0.5">
                                Qty: {item.quantity} × {inr(item.unit_price)}
                              </div>
                            </div>
                            <div className="font-semibold text-stone-900">
                              {inr(item.quantity * item.unit_price)}
                            </div>
                          </div>
                        ))}

                        {/* Order Subtotal / Summary */}
                        <div className="bg-stone-50/70 p-3.5 space-y-1.5 text-xs text-stone-600">
                          <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span className="font-medium text-stone-900">
                              {inr(drawerBundle.order.subtotal)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Shipping across India</span>
                            <span className="font-medium text-emerald-700">Free</span>
                          </div>
                          <div className="flex justify-between text-sm font-bold text-stone-900 pt-2 border-t border-stone-200">
                            <span>Total</span>
                            <span>{inr(drawerBundle.order.subtotal)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Customer & Shipping Details */}
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
                        Customer & Shipping
                      </h3>
                      <div className="bg-stone-50/60 border border-stone-200 rounded-xl p-4 space-y-3 text-xs text-stone-700">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="font-bold text-sm text-stone-900">
                              {drawerBundle.order.customer_name}
                            </div>
                            <div className="flex items-center space-x-1.5 text-stone-600">
                              <Mail className="w-3.5 h-3.5 text-stone-400" />
                              <a
                                href={`mailto:${drawerBundle.order.customer_email}`}
                                className="underline hover:text-stone-900"
                              >
                                {drawerBundle.order.customer_email}
                              </a>
                            </div>
                            {drawerBundle.order.customer_phone && (
                              <div className="flex items-center space-x-1.5 text-stone-600">
                                <Phone className="w-3.5 h-3.5 text-stone-400" />
                                <a
                                  href={`tel:${drawerBundle.order.customer_phone}`}
                                  className="underline hover:text-stone-900"
                                >
                                  {drawerBundle.order.customer_phone}
                                </a>
                              </div>
                            )}
                          </div>

                          {drawerBundle.order.customer_id && (
                            <button
                              onClick={() =>
                                router.push(
                                  `/customers?id=${drawerBundle.order.customer_id}`
                                )
                              }
                              className="text-stone-600 hover:text-stone-900 flex items-center space-x-1 text-[11px] font-medium bg-white px-2 py-1 rounded border border-stone-200"
                            >
                              <span>Customer Profile</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {/* Address */}
                        <div className="pt-2 border-t border-stone-200/80">
                          <div className="flex items-center justify-between text-stone-500 text-[11px] font-semibold uppercase tracking-wider mb-1.5">
                            <span>Delivery Address</span>
                            <button
                              onClick={() => {
                                const a = drawerBundle.order.shipping_address;
                                const formatted = [
                                  a?.fullName || drawerBundle.order.customer_name,
                                  a?.line1,
                                  a?.line2,
                                  `${a?.city || ''}, ${a?.state || ''} ${a?.postalCode || ''}`,
                                  a?.country,
                                  `Phone: ${drawerBundle.order.customer_phone || ''}`,
                                ]
                                  .filter(Boolean)
                                  .join('\n');
                                copyToClipboard(formatted, 'address');
                              }}
                              className="inline-flex items-center space-x-1 text-stone-600 hover:text-stone-900"
                            >
                              {copiedField === 'address' ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-700">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy Label</span>
                                </>
                              )}
                            </button>
                          </div>
                          <div className="text-stone-800 leading-relaxed bg-white p-2.5 rounded-lg border border-stone-200/80">
                            <div>
                              {drawerBundle.order.shipping_address?.fullName ||
                                drawerBundle.order.customer_name}
                            </div>
                            <div>{drawerBundle.order.shipping_address?.line1}</div>
                            {drawerBundle.order.shipping_address?.line2 && (
                              <div>{drawerBundle.order.shipping_address?.line2}</div>
                            )}
                            <div>
                              {drawerBundle.order.shipping_address?.city},{' '}
                              {drawerBundle.order.shipping_address?.state}{' '}
                              <span className="font-semibold">
                                {drawerBundle.order.shipping_address?.postalCode}
                              </span>
                            </div>
                            <div>{drawerBundle.order.shipping_address?.country || 'India'}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payment & Gateway Breakdown */}
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
                        Payment & Gateway
                      </h3>
                      <div className="bg-stone-50/60 border border-stone-200 rounded-xl p-4 text-xs space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="text-stone-500">Method</span>
                          <span className="font-medium text-stone-900">
                            Razorpay (UPI / NetBanking / Cards)
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-stone-500">Razorpay Order ID</span>
                          {drawerBundle.order.razorpay_order_id ? (
                            <a
                              href={`https://dashboard.razorpay.com/app/orders/${drawerBundle.order.razorpay_order_id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-amber-900 hover:text-amber-950 font-medium inline-flex items-center space-x-1"
                              title="View in Razorpay Dashboard"
                            >
                              <span>{drawerBundle.order.razorpay_order_id}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="font-mono text-stone-400">Not generated</span>
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-stone-500">Razorpay Payment ID</span>
                          {drawerBundle.order.razorpay_payment_id ? (
                            <a
                              href={`https://dashboard.razorpay.com/app/payments/${drawerBundle.order.razorpay_payment_id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-emerald-800 hover:text-emerald-950 font-medium inline-flex items-center space-x-1"
                              title="View payment in Razorpay Dashboard"
                            >
                              <span>{drawerBundle.order.razorpay_payment_id}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="font-mono text-stone-400 italic">
                              Awaiting payment
                            </span>
                          )}
                        </div>

                        {drawerBundle.order.refund_id && (
                          <div className="flex justify-between items-center pt-2 border-t border-stone-200/70">
                            <span className="text-purple-800 font-medium">Refund ID</span>
                            <span className="font-mono text-purple-900 font-bold">
                              {drawerBundle.order.refund_id}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Invoice Info */}
                    {drawerBundle.invoice && (
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
                          Sales Invoice
                        </h3>
                        <div className="bg-stone-50/60 border border-stone-200 rounded-xl p-4 text-xs flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white rounded-lg border border-stone-200 text-stone-700">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-stone-900">
                                {drawerBundle.invoice.invoice_no}
                              </div>
                              <div className="text-stone-500 text-[11px]">
                                Issued {when(drawerBundle.invoice.issued_at)} • Total:{' '}
                                {inr(drawerBundle.invoice.total)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800">
                              Generated
                            </span>
                            <button
                              onClick={() => setInvoiceOpen(true)}
                              className="px-2.5 py-1 bg-stone-900 text-white rounded-md text-[11px] font-medium hover:bg-stone-800 transition-colors"
                            >
                              View Invoice
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : null}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
                <button
                  onClick={closeDrawer}
                  className="px-4 py-2 border border-stone-300 text-xs font-medium rounded-lg text-stone-700 bg-white hover:bg-stone-100 transition-colors"
                >
                  Close
                </button>
                {drawerBundle && (
                  <div className="text-xs text-stone-500">
                    Order ID: <span className="font-mono">{drawerBundle.order.id}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Invoice Modal */}
      {drawerBundle?.invoice && (
        <InvoiceModal
          isOpen={invoiceOpen}
          onClose={() => setInvoiceOpen(false)}
          order={drawerBundle.order}
          items={drawerBundle.items}
          invoice={drawerBundle.invoice}
          store={store}
        />
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="p-16 text-center text-stone-500">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-stone-400 mb-3" />
          <p className="text-sm">Loading orders portal...</p>
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}
