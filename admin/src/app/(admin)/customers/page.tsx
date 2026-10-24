'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Customer, Order, OrderStatus } from '@/lib/types';
import { getCustomer, listCustomerOrders, listCustomers, listOrders } from '@/lib/api';
import { inr, statusLabel, timeAgo, when, whenTime } from '@/lib/format';
import {
  Users,
  Search,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  ExternalLink,
  Copy,
  Check,
  ChevronRight,
  Clock,
  CheckCircle2,
  Truck,
  PackageCheck,
  XCircle,
  Loader2,
  RefreshCw,
  X,
  Calendar,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

function getStatusBadge(status: OrderStatus) {
  switch (status) {
    case 'pending':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'paid':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'shipped':
      return 'bg-sky-50 text-sky-800 border-sky-200';
    case 'delivered':
      return 'bg-indigo-50 text-indigo-800 border-indigo-200';
    case 'cancelled':
      return 'bg-rose-50 text-rose-800 border-rose-200';
    default:
      return 'bg-stone-100 text-stone-700 border-stone-200';
  }
}

function CustomersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCustomerIdFromUrl = searchParams.get('id');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected customer drawer
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    selectedCustomerIdFromUrl
  );
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [custList, orderList] = await Promise.all([listCustomers(), listOrders()]);
      setCustomers(custList);
      setAllOrders(orderList);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch customer data.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedCustomerIdFromUrl) {
      setSelectedCustomerId(selectedCustomerIdFromUrl);
    }
  }, [selectedCustomerIdFromUrl]);

  // Load selected customer and their orders
  useEffect(() => {
    if (!selectedCustomerId) {
      setSelectedCustomer(null);
      setCustomerOrders([]);
      return;
    }

    let active = true;
    setDrawerLoading(true);

    Promise.all([getCustomer(selectedCustomerId), listCustomerOrders(selectedCustomerId)])
      .then(([cust, orders]) => {
        if (active) {
          setSelectedCustomer(cust);
          setCustomerOrders(orders);
        }
      })
      .catch((err) => {
        console.error('Error fetching customer details:', err);
      })
      .finally(() => {
        if (active) setDrawerLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedCustomerId]);

  const openDrawer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    router.push(`/customers?id=${customerId}`, { scroll: false });
  };

  const closeDrawer = () => {
    setSelectedCustomerId(null);
    setSelectedCustomer(null);
    setCustomerOrders([]);
    router.push('/customers', { scroll: false });
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Map customer spend & order count
  const customerStatsMap = useMemo(() => {
    const map = new Map<string, { orderCount: number; totalSpend: number }>();
    allOrders.forEach((o) => {
      const key = o.customer_id || o.customer_email;
      const current = map.get(key) || { orderCount: 0, totalSpend: 0 };
      current.orderCount += 1;
      if (['paid', 'shipped', 'delivered'].includes(o.status)) {
        current.totalSpend += Number(o.subtotal) || 0;
      }
      map.set(key, current);
    });
    return map;
  }, [allOrders]);

  // Filter customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.default_address?.city && c.default_address.city.toLowerCase().includes(q)) ||
        (c.default_address?.state && c.default_address.state.toLowerCase().includes(q))
      );
    });
  }, [customers, searchQuery]);

  // Aggregate overview metrics
  const totalLifetimeRevenue = useMemo(() => {
    return allOrders
      .filter((o) => ['paid', 'shipped', 'delivered'].includes(o.status))
      .reduce((acc, curr) => acc + (Number(curr.subtotal) || 0), 0);
  }, [allOrders]);

  const repeatCustomersCount = useMemo(() => {
    let count = 0;
    customerStatsMap.forEach((val) => {
      if (val.orderCount > 1) count += 1;
    });
    return count;
  }, [customerStatsMap]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-stone-900 tracking-tight">
            Customers
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Directory of buyers, contact details, and lifetime order histories.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchInitialData}
            disabled={loading}
            className="inline-flex items-center space-x-2 border border-stone-200 bg-white px-3.5 py-2 rounded-lg text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors shadow-2xs"
            title="Refresh customer list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Total Customers
            </span>
            <div className="p-2 bg-stone-100 rounded-lg text-stone-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900 mt-2">{customers.length}</div>
          <div className="text-xs text-stone-500 mt-1">Captured during checkout</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Repeat Patrons
            </span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900 mt-2">
            {repeatCustomersCount}
          </div>
          <div className="text-xs text-stone-500 mt-1">Customers with &gt; 1 order</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Lifetime Value
            </span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-700">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900 mt-2">
            {inr(totalLifetimeRevenue)}
          </div>
          <div className="text-xs text-stone-500 mt-1">Total realized customer spend</div>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, phone, city..."
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

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-stone-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-stone-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-stone-400 mb-3" />
            <p className="text-sm">Loading customer directory...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
            <p className="text-sm text-stone-700 font-medium">Failed to load customers</p>
            <p className="text-xs text-rose-600 mt-1">{error}</p>
            <button
              onClick={fetchInitialData}
              className="mt-4 px-4 py-1.5 bg-stone-900 text-white text-xs font-medium rounded-lg hover:bg-stone-800"
            >
              Retry
            </button>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-16 text-center text-stone-500">
            <Users className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <p className="text-base font-medium text-stone-800">No customers found</p>
            <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? 'Try a different search query.'
                : 'Customer profiles are automatically created when orders are placed.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 px-3 py-1.5 border border-stone-200 text-xs font-medium rounded-lg hover:bg-stone-50 text-stone-700"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-700">
              <thead className="bg-stone-50/80 border-b border-stone-200 text-xs font-semibold uppercase tracking-wider text-stone-500">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Customer</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4 text-center">Orders</th>
                  <th className="py-3.5 px-4">Total Spent</th>
                  <th className="py-3.5 px-4">First Order</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredCustomers.map((cust) => {
                  const stats = customerStatsMap.get(cust.id) ||
                    customerStatsMap.get(cust.email) || {
                      orderCount: 0,
                      totalSpend: 0,
                    };

                  return (
                    <tr
                      key={cust.id}
                      onClick={() => openDrawer(cust.id)}
                      className="hover:bg-amber-50/30 transition-colors cursor-pointer group"
                    >
                      {/* Name & Contact */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="font-semibold text-stone-900 group-hover:text-amber-900 transition-colors">
                          {cust.name}
                        </div>
                        <div className="text-xs text-stone-500 flex items-center space-x-2 mt-0.5">
                          <span>{cust.email}</span>
                          {cust.phone && (
                            <>
                              <span>•</span>
                              <span>{cust.phone}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* City / State */}
                      <td className="py-4 px-4 text-xs text-stone-600">
                        {cust.default_address?.city ? (
                          <>
                            <div>{cust.default_address.city}</div>
                            <div className="text-[11px] text-stone-400">
                              {cust.default_address.state}
                            </div>
                          </>
                        ) : (
                          <span className="text-stone-400 italic">Not recorded</span>
                        )}
                      </td>

                      {/* Orders Count */}
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-800">
                          {stats.orderCount}
                        </span>
                      </td>

                      {/* Total Spent */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-stone-900">
                          {inr(stats.totalSpend)}
                        </div>
                      </td>

                      {/* Member Since */}
                      <td className="py-4 px-4 text-xs text-stone-500">
                        {when(cust.created_at)}
                      </td>

                      {/* Action */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDrawer(cust.id);
                          }}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
                        >
                          <span>History</span>
                          <ChevronRight className="w-3.5 h-3.5" />
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

      {/* Slide-over Customer Profile & Orders Drawer */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={closeDrawer}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col border-l border-stone-200 animate-in slide-in-from-right duration-250 ease-out">
              {/* Header */}
              <div className="px-6 py-5 border-b border-stone-200 bg-stone-50/70 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold font-serif text-stone-900">
                    {selectedCustomer?.name || 'Customer Details'}
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Customer ID: <span className="font-mono">{selectedCustomerId}</span>
                  </p>
                </div>
                <button
                  onClick={closeDrawer}
                  className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {drawerLoading ? (
                  <div className="py-24 text-center text-stone-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-stone-400 mb-3" />
                    <p className="text-sm">Loading customer profile & history...</p>
                  </div>
                ) : selectedCustomer ? (
                  <>
                    {/* Customer Info Card */}
                    <div className="bg-stone-50/70 border border-stone-200 rounded-xl p-4 space-y-3 text-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-stone-200/70">
                        <span className="font-semibold uppercase tracking-wider text-[11px] text-stone-500">
                          Contact Information
                        </span>
                        <span className="text-stone-400">
                          Joined {when(selectedCustomer.created_at)}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-3.5 h-3.5 text-stone-400" />
                          <a
                            href={`mailto:${selectedCustomer.email}`}
                            className="text-stone-800 underline hover:text-stone-950 font-medium"
                          >
                            {selectedCustomer.email}
                          </a>
                        </div>
                        {selectedCustomer.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="w-3.5 h-3.5 text-stone-400" />
                            <a
                              href={`tel:${selectedCustomer.phone}`}
                              className="text-stone-800 underline hover:text-stone-950"
                            >
                              {selectedCustomer.phone}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Default Shipping Address */}
                      {selectedCustomer.default_address && (
                        <div className="pt-2 border-t border-stone-200/70">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-semibold uppercase tracking-wider text-[11px] text-stone-500">
                              Default Shipping Address
                            </span>
                            <button
                              onClick={() => {
                                const a = selectedCustomer.default_address;
                                const formatted = [
                                  a?.fullName || selectedCustomer.name,
                                  a?.line1,
                                  a?.line2,
                                  `${a?.city || ''}, ${a?.state || ''} ${a?.postalCode || ''}`,
                                  a?.country,
                                  `Phone: ${selectedCustomer.phone || ''}`,
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
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                          <div className="text-stone-700 bg-white p-2.5 rounded-lg border border-stone-200/80 leading-relaxed">
                            <div>{selectedCustomer.default_address.fullName}</div>
                            <div>{selectedCustomer.default_address.line1}</div>
                            {selectedCustomer.default_address.line2 && (
                              <div>{selectedCustomer.default_address.line2}</div>
                            )}
                            <div>
                              {selectedCustomer.default_address.city},{' '}
                              {selectedCustomer.default_address.state}{' '}
                              <span className="font-semibold">
                                {selectedCustomer.default_address.postalCode}
                              </span>
                            </div>
                            <div>{selectedCustomer.default_address.country}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Order History */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                          Order History ({customerOrders.length})
                        </h3>
                        <span className="text-xs text-stone-500 font-medium">
                          Total:{' '}
                          {inr(
                            customerOrders
                              .filter((o) => ['paid', 'shipped', 'delivered'].includes(o.status))
                              .reduce((a, b) => a + (Number(b.subtotal) || 0), 0)
                          )}
                        </span>
                      </div>

                      {customerOrders.length === 0 ? (
                        <div className="p-8 text-center bg-stone-50 rounded-xl border border-dashed border-stone-200 text-stone-500 text-xs">
                          No orders associated with this customer yet.
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {customerOrders.map((ord) => (
                            <div
                              key={ord.id}
                              className="p-3.5 bg-white border border-stone-200 rounded-xl flex items-center justify-between hover:border-stone-300 transition-colors shadow-2xs"
                            >
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-stone-900 text-xs">
                                    #{ord.id.slice(0, 10)}
                                  </span>
                                  <span
                                    className={`px-2 py-0.2 rounded-full text-[10px] font-medium border ${getStatusBadge(
                                      ord.status
                                    )}`}
                                  >
                                    {statusLabel(ord.status)}
                                  </span>
                                </div>
                                <div className="text-[11px] text-stone-500 mt-1">
                                  {whenTime(ord.created_at)} ({timeAgo(ord.created_at)})
                                </div>
                              </div>

                              <div className="flex items-center space-x-3">
                                <span className="font-bold text-sm text-stone-900">
                                  {inr(ord.subtotal)}
                                </span>
                                <button
                                  onClick={() => router.push(`/orders?id=${ord.id}`)}
                                  className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                                  title="View full order"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : null}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-end">
                <button
                  onClick={closeDrawer}
                  className="px-4 py-2 border border-stone-300 text-xs font-medium rounded-lg text-stone-700 bg-white hover:bg-stone-100 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomersPage() {
  return (
    <Suspense
      fallback={
        <div className="p-16 text-center text-stone-500">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-stone-400 mb-3" />
          <p className="text-sm">Loading customers directory...</p>
        </div>
      }
    >
      <CustomersContent />
    </Suspense>
  );
}
