'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { Product, Supplier } from '@/lib/types';
import {
  createPurchase,
  deleteSupplier,
  listProducts,
  listPurchases,
  listSuppliers,
  saveSupplier,
  type PurchaseDraft,
  type PurchaseRecord,
} from '@/lib/api';
import { inr, when } from '@/lib/format';
import {
  Truck,
  Plus,
  Search,
  Building2,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  X,
  Edit2,
  Trash2,
  Package,
  Layers,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';

export default function PurchasesPage() {
  const [activeTab, setActiveTab] = useState<'bills' | 'suppliers'>('bills');

  // Data
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Purchase Bill Modal
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [billSupplierId, setBillSupplierId] = useState<string>('');
  const [billNo, setBillNo] = useState('');
  const [billDate, setBillDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [billNotes, setBillNotes] = useState('');
  const [billLines, setBillLines] = useState<
    Array<{ product_id: string; description: string; quantity: number; unit_cost: number }>
  >([{ product_id: '', description: '', quantity: 1, unit_cost: 0 }]);
  const [savingBill, setSavingBill] = useState(false);
  const [billError, setBillError] = useState<string | null>(null);

  // Supplier Modal
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supName, setSupName] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supAddress, setSupAddress] = useState('');
  const [supGstin, setSupGstin] = useState('');
  const [savingSupplier, setSavingSupplier] = useState(false);
  const [supplierError, setSupplierError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [purList, supList, prodList] = await Promise.all([
        listPurchases(),
        listSuppliers(),
        listProducts(),
      ]);
      setPurchases(purList);
      setSuppliers(supList);
      setProducts(prodList);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch purchase data.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Open New Purchase Bill Modal
  const openNewBillModal = (supplierId?: string) => {
    setBillSupplierId(supplierId ?? suppliers[0]?.id ?? '');
    setBillNo(`BILL-${Date.now().toString().slice(-4)}`);
    setBillDate(new Date().toISOString().slice(0, 10));
    setBillNotes('');
    setBillLines([
      {
        product_id: products[0]?.id || '',
        description: products[0]?.title || '',
        quantity: 1,
        unit_cost: 0,
      },
    ]);
    setBillError(null);
    setBillModalOpen(true);
  };

  // Add line to bill
  const handleAddBillLine = () => {
    setBillLines((prev) => [
      ...prev,
      {
        product_id: products[0]?.id || '',
        description: products[0]?.title || '',
        quantity: 1,
        unit_cost: 0,
      },
    ]);
  };

  // Remove line from bill
  const handleRemoveBillLine = (index: number) => {
    setBillLines((prev) => prev.filter((_, i) => i !== index));
  };

  // Update line product
  const handleLineProductChange = (index: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    setBillLines((prev) =>
      prev.map((line, i) =>
        i === index
          ? {
              ...line,
              product_id: prodId,
              description: prod ? prod.title : line.description,
            }
          : line
      )
    );
  };

  // Update line fields
  const handleLineFieldChange = (
    index: number,
    field: 'description' | 'quantity' | 'unit_cost',
    value: string | number
  ) => {
    setBillLines((prev) =>
      prev.map((line, i) =>
        i === index
          ? {
              ...line,
              [field]:
                field === 'quantity' || field === 'unit_cost' ? Number(value) || 0 : value,
            }
          : line
      )
    );
  };

  // Compute bill grand total
  const billComputedTotal = useMemo(() => {
    return billLines.reduce((acc, curr) => acc + curr.quantity * curr.unit_cost, 0);
  }, [billLines]);

  // Submit Purchase Bill
  const handleSaveBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billNo.trim()) {
      setBillError('Bill number is required.');
      return;
    }
    if (billLines.length === 0) {
      setBillError('At least one item line is required.');
      return;
    }
    for (const line of billLines) {
      if (line.quantity <= 0) {
        setBillError('All item quantities must be greater than 0.');
        return;
      }
      if (line.unit_cost <= 0) {
        setBillError('Enter the unit cost for every line.');
        return;
      }
    }

    setSavingBill(true);
    setBillError(null);
    try {
      const draft: PurchaseDraft = {
        supplier_id: billSupplierId || null,
        bill_no: billNo.trim(),
        bill_date: billDate,
        notes: billNotes.trim() || null,
        items: billLines.map((l) => ({
          product_id: l.product_id || null,
          description: l.description,
          quantity: l.quantity,
          unit_cost: l.unit_cost,
        })),
      };

      await createPurchase(draft);
      await fetchData(); // refreshes both purchases and incremented product stocks!
      setBillModalOpen(false);
      setActionSuccess(`Recorded purchase bill ${draft.bill_no} and updated product stock!`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save purchase bill.';
      setBillError(msg);
    } finally {
      setSavingBill(false);
    }
  };

  // Open Supplier Modal
  const openSupplierModal = (sup?: Supplier) => {
    if (sup) {
      setEditingSupplier(sup);
      setSupName(sup.name);
      setSupPhone(sup.phone || '');
      setSupEmail(sup.email || '');
      setSupAddress(sup.address || '');
      setSupGstin(sup.gstin || '');
    } else {
      setEditingSupplier(null);
      setSupName('');
      setSupPhone('');
      setSupEmail('');
      setSupAddress('');
      setSupGstin('');
    }
    setSupplierError(null);
    setSupplierModalOpen(true);
  };

  // Save Supplier
  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) {
      setSupplierError('Supplier name is required.');
      return;
    }

    setSavingSupplier(true);
    setSupplierError(null);
    try {
      await saveSupplier({
        id: editingSupplier?.id,
        name: supName.trim(),
        phone: supPhone.trim() || null,
        email: supEmail.trim() || null,
        address: supAddress.trim() || null,
        gstin: supGstin.trim() || null,
      });

      const updated = await listSuppliers();
      setSuppliers(updated);
      setSupplierModalOpen(false);
      setActionSuccess(
        editingSupplier
          ? `Supplier "${supName}" updated.`
          : `New supplier "${supName}" added.`
      );
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save supplier.';
      setSupplierError(msg);
    } finally {
      setSavingSupplier(false);
    }
  };

  // Delete Supplier
  const handleDeleteSupplier = async (sup: Supplier) => {
    if (!confirm(`Are you sure you want to remove supplier "${sup.name}"?`)) return;
    setDeletingId(sup.id);
    try {
      await deleteSupplier(sup.id);
      setSuppliers((prev) => prev.filter((s) => s.id !== sup.id));
      setActionSuccess(`Supplier "${sup.name}" deleted.`);
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete supplier.';
      alert(msg);
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered Bills
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      const sup = suppliers.find((s) => s.id === p.supplier_id);
      return (
        p.bill_no.toLowerCase().includes(q) ||
        (sup && sup.name.toLowerCase().includes(q)) ||
        (p.notes && p.notes.toLowerCase().includes(q)) ||
        p.items?.some((i) => i.description.toLowerCase().includes(q))
      );
    });
  }, [purchases, suppliers, searchQuery]);

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.phone && s.phone.toLowerCase().includes(q)) ||
        (s.gstin && s.gstin.toLowerCase().includes(q))
      );
    });
  }, [suppliers, searchQuery]);

  // Total Procurement Spend
  const totalProcurementSpend = useMemo(() => {
    return purchases.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
  }, [purchases]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-stone-900 tracking-tight">
            Purchases & Suppliers
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Log raw materials & kit purchase invoices to replenish inventory.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center space-x-2 border border-stone-200 bg-white px-3.5 py-2 rounded-lg text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors shadow-2xs"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {activeTab === 'bills' ? (
            <button
              onClick={() => openNewBillModal()}
              className="inline-flex items-center space-x-2 bg-[#380b0c] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#4d1012] transition-colors shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Record Purchase Bill</span>
            </button>
          ) : (
            <button
              onClick={() => openSupplierModal()}
              className="inline-flex items-center space-x-2 bg-[#380b0c] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#4d1012] transition-colors shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Supplier</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Procurement Bills
            </span>
            <div className="p-2 bg-stone-100 rounded-lg text-stone-700">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900 mt-2">{purchases.length}</div>
          <div className="text-xs text-stone-500 mt-1">Invoices logged to inventory</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Active Suppliers
            </span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-700">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900 mt-2">{suppliers.length}</div>
          <div className="text-xs text-stone-500 mt-1">Vendors & mill partners</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Total Sourcing Spend
            </span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900 mt-2">
            {inr(totalProcurementSpend)}
          </div>
          <div className="text-xs text-stone-500 mt-1">Across all vendor bills</div>
        </div>
      </div>

      {/* Action Success Alert */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between animate-in fade-in">
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

      {/* Tabs & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('bills')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-2 ${
                activeTab === 'bills'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Purchase Bills ({purchases.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-2 ${
                activeTab === 'suppliers'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Suppliers ({suppliers.length})</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={
                activeTab === 'bills'
                  ? 'Search bill number, vendor, item...'
                  : 'Search vendor name, GSTIN, email...'
              }
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

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-xl border border-stone-200/80 p-16 text-center text-stone-500">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-stone-400 mb-3" />
          <p className="text-sm">Loading procurement records...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border border-stone-200/80 p-12 text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
          <p className="text-sm text-stone-700 font-medium">Failed to load data</p>
          <p className="text-xs text-rose-600 mt-1">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-1.5 bg-stone-900 text-white text-xs font-medium rounded-lg hover:bg-stone-800"
          >
            Retry
          </button>
        </div>
      ) : activeTab === 'bills' ? (
        /* Purchase Bills List */
        filteredPurchases.length === 0 ? (
          <div className="bg-white rounded-xl border border-stone-200/80 p-16 text-center text-stone-500">
            <FileText className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <p className="text-base font-medium text-stone-800">No purchase bills recorded</p>
            <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">
              Record invoices from fabric mills, hoop carvers, and thread vendors to
              automatically increase product stock.
            </p>
            <button
              onClick={() => openNewBillModal()}
              className="mt-4 px-4 py-2 bg-[#380b0c] text-white text-xs font-medium rounded-lg hover:bg-[#4d1012] inline-flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record First Bill</span>
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-stone-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-stone-700">
                <thead className="bg-stone-50/80 border-b border-stone-200 text-xs font-semibold uppercase tracking-wider text-stone-500">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Bill No</th>
                    <th className="py-3.5 px-4">Supplier</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Items Added to Stock</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Bill Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredPurchases.map((bill) => {
                    const sup = suppliers.find((s) => s.id === bill.supplier_id);
                    return (
                      <tr key={bill.id} className="hover:bg-amber-50/20 transition-colors">
                        {/* Bill No */}
                        <td className="py-4 px-4 sm:px-6 font-semibold text-stone-900 font-mono">
                          {bill.bill_no}
                          {bill.notes && (
                            <div className="font-sans text-[11px] text-stone-400 font-normal mt-0.5">
                              {bill.notes}
                            </div>
                          )}
                        </td>

                        {/* Supplier */}
                        <td className="py-4 px-4">
                          <div className="font-medium text-stone-900">
                            {sup?.name || 'Unassigned Vendor'}
                          </div>
                          {sup?.gstin && (
                            <div className="text-[11px] text-stone-400">
                              GST: {sup.gstin}
                            </div>
                          )}
                        </td>

                        {/* Date */}
                        <td className="py-4 px-4 text-xs text-stone-600">
                          {when(bill.bill_date)}
                        </td>

                        {/* Items Added */}
                        <td className="py-4 px-4 text-xs">
                          <div className="space-y-1">
                            {bill.items?.map((it) => (
                              <div
                                key={it.id}
                                className="flex items-center space-x-1 text-stone-700"
                              >
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  +{it.quantity}
                                </span>
                                <span className="font-medium truncate max-w-[200px]">
                                  {it.description}
                                </span>
                                <span className="text-stone-400">
                                  @ {inr(it.unit_cost)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Total */}
                        <td className="py-4 px-4 sm:px-6 text-right">
                          <div className="font-bold text-stone-900 text-sm">
                            {inr(bill.total)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Suppliers List */
        filteredSuppliers.length === 0 ? (
          <div className="bg-white rounded-xl border border-stone-200/80 p-16 text-center text-stone-500">
            <Building2 className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <p className="text-base font-medium text-stone-800">No suppliers found</p>
            <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">
              Add vendor contact details, mill addresses, and GSTIN information.
            </p>
            <button
              onClick={() => openSupplierModal()}
              className="mt-4 px-4 py-2 bg-[#380b0c] text-white text-xs font-medium rounded-lg hover:bg-[#4d1012] inline-flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Supplier</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSuppliers.map((sup) => (
              <div
                key={sup.id}
                className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs hover:border-stone-300 transition-colors flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-stone-900">{sup.name}</h3>
                      {sup.gstin && (
                        <span className="inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-mono font-medium bg-stone-100 text-stone-700">
                          GSTIN: {sup.gstin}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => openSupplierModal(sup)}
                        className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                        title="Edit supplier"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSupplier(sup)}
                        disabled={deletingId === sup.id}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete supplier"
                      >
                        {deletingId === sup.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-stone-600">
                    {sup.email && <div>Email: {sup.email}</div>}
                    {sup.phone && <div>Phone: {sup.phone}</div>}
                    {sup.address && (
                      <div className="text-stone-500 pt-1 leading-relaxed">
                        {sup.address}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                  <span>
                    Purchases logged:{' '}
                    <strong className="text-stone-800">
                      {purchases.filter((p) => p.supplier_id === sup.id).length}
                    </strong>
                  </span>
                  <button
                    onClick={() => {
                      openNewBillModal(sup.id);
                    }}
                    className="text-stone-800 hover:text-amber-900 font-medium inline-flex items-center space-x-1"
                  >
                    <span>Record Bill</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Record Purchase Bill Modal */}
      {billModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div>
                <h3 className="text-lg font-bold font-serif text-stone-900">
                  Record Purchase Bill
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Saving this bill will automatically increase inventory for the selected
                  products.
                </p>
              </div>
              <button
                onClick={() => setBillModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {billError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{billError}</span>
              </div>
            )}

            <form onSubmit={handleSaveBill} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Supplier */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Supplier
                  </label>
                  <select
                    value={billSupplierId}
                    onChange={(e) => setBillSupplierId(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-stone-400"
                  >
                    <option value="">-- No Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bill No */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Bill / Invoice No *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ML-9912"
                    value={billNo}
                    onChange={(e) => setBillNo(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-stone-400 font-mono"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Bill Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-stone-400"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-stone-700">
                    Line Items & Added Quantities *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddBillLine}
                    className="text-xs font-medium text-amber-900 hover:text-amber-950 inline-flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="border border-stone-200 rounded-xl divide-y divide-stone-100 overflow-hidden bg-stone-50/50">
                  {billLines.map((line, idx) => (
                    <div key={idx} className="p-3 flex items-center gap-2">
                      {/* Product Selector */}
                      <div className="flex-1">
                        <select
                          value={line.product_id}
                          onChange={(e) => handleLineProductChange(idx, e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-stone-400"
                        >
                          <option value="">-- Custom Description --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.title} (Current Stock: {p.stock})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Description */}
                      <div className="w-32">
                        <input
                          type="text"
                          placeholder="Description"
                          value={line.description}
                          onChange={(e) =>
                            handleLineFieldChange(idx, 'description', e.target.value)
                          }
                          className="w-full text-xs px-2 py-1.5 bg-white border border-stone-200 rounded-lg"
                        />
                      </div>

                      {/* Quantity */}
                      <div className="w-20">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={line.quantity}
                          onChange={(e) =>
                            handleLineFieldChange(idx, 'quantity', e.target.value)
                          }
                          className="w-full text-xs px-2 py-1.5 bg-white border border-stone-200 rounded-lg font-mono text-center"
                          title="Quantity to add to stock"
                        />
                      </div>

                      {/* Unit Cost */}
                      <div className="w-24">
                        <input
                          type="number"
                          min="0"
                          placeholder="Unit Cost"
                          value={line.unit_cost}
                          onChange={(e) =>
                            handleLineFieldChange(idx, 'unit_cost', e.target.value)
                          }
                          className="w-full text-xs px-2 py-1.5 bg-white border border-stone-200 rounded-lg font-mono text-right"
                          title="Cost per unit in INR"
                        />
                      </div>

                      {/* Line Total */}
                      <div className="w-20 text-right text-xs font-semibold text-stone-900 pr-1">
                        {inr(line.quantity * line.unit_cost)}
                      </div>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleRemoveBillLine(idx)}
                        disabled={billLines.length === 1}
                        className="text-stone-400 hover:text-rose-600 p-1 disabled:opacity-30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Grand Total */}
                <div className="flex justify-between items-center px-4 py-2 bg-stone-100 rounded-lg mt-2 text-xs font-bold text-stone-900">
                  <span>Total Purchase Cost:</span>
                  <span className="text-sm font-mono">{inr(billComputedTotal)}</span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Notes / Batch Details
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. October batch: pure linen cloth and 6-inch beechwood hoops."
                  value={billNotes}
                  onChange={(e) => setBillNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-stone-400"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setBillModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 text-xs font-medium rounded-lg text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBill}
                  className="px-5 py-2 bg-[#380b0c] text-white text-xs font-medium rounded-lg hover:bg-[#4d1012] transition-colors shadow-2xs inline-flex items-center space-x-1.5"
                >
                  {savingBill ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving & Adding Stock...</span>
                    </>
                  ) : (
                    <span>Record Bill & Update Stock</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Modal (Create / Edit) */}
      {supplierModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <h3 className="text-base font-bold font-serif text-stone-900">
                {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
              </h3>
              <button
                onClick={() => setSupplierModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {supplierError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{supplierError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSupplier} className="space-y-3 mt-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Supplier Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Malabar Linen Co."
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-stone-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  GSTIN
                </label>
                <input
                  type="text"
                  placeholder="e.g. 32AABCM4412P1Z8"
                  value={supGstin}
                  onChange={(e) => setSupGstin(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-stone-400 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98470 22108"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-stone-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="orders@vendor.com"
                    value={supEmail}
                    onChange={(e) => setSupEmail(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-stone-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Address
                </label>
                <textarea
                  rows={2}
                  placeholder="Weaver street, Kannur, Kerala 670001"
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-stone-400"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setSupplierModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 text-xs font-medium rounded-lg text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSupplier}
                  className="px-5 py-2 bg-[#380b0c] text-white text-xs font-medium rounded-lg hover:bg-[#4d1012] transition-colors shadow-2xs inline-flex items-center space-x-1.5"
                >
                  {savingSupplier ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingSupplier ? 'Update Supplier' : 'Save Supplier'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
