'use client';

import React from 'react';
import type { Invoice, Order, OrderItem, StoreProfile } from '@/lib/types';
import { inr, when } from '@/lib/format';
import { Printer, X, Download } from 'lucide-react';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  items: OrderItem[];
  invoice: Invoice;
  store: StoreProfile | null;
}

export function InvoiceModal({ isOpen, onClose, order, items, invoice, store }: InvoiceModalProps) {
  if (!isOpen) return null;

  const invoiceNo = invoice.invoice_no;
  const invoiceDate = when(invoice.issued_at);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 print:p-0 print:bg-white">
      {/* Container */}
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        {/* Modal Controls (Hidden in Print) */}
        <div className="px-6 py-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <span className="font-serif font-bold text-stone-900 text-sm">
              Tax Invoice Preview ({invoiceNo})
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#380b0c] text-white rounded-lg text-xs font-medium hover:bg-[#4d1012] transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/70 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="flex-1 overflow-y-auto p-8 sm:p-12 text-stone-800 text-xs font-sans print:p-6 print:overflow-visible bg-white">
          {/* Header */}
          <div className="flex justify-between items-start pb-8 border-b-2 border-stone-900">
            <div>
              <h1 className="text-2xl font-serif font-bold tracking-wider text-[#380b0c]">
                {store?.name || 'HILO ARTE'}
              </h1>
              <p className="text-[11px] text-stone-500 tracking-wide uppercase mt-0.5">
                Luxury Handcraft & Creative Experiences
              </p>
              <div className="mt-3 text-[11px] text-stone-600 space-y-0.5 leading-relaxed">
                {store?.address && <div className="whitespace-pre-line">{store.address}</div>}
                {store?.gstin ? (
                  <div>GSTIN: {store.gstin}</div>
                ) : (
                  <div className="text-rose-600 print:text-rose-600">GSTIN not set (Settings → Store profile)</div>
                )}
                {(store?.email || store?.phone) && (
                  <div>
                    {store?.email && <>Email: {store.email}</>}
                    {store?.email && store?.phone && ' | '}
                    {store?.phone && <>Phone: {store.phone}</>}
                  </div>
                )}
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-stone-900 text-white font-mono font-bold text-xs uppercase tracking-widest rounded">
                TAX INVOICE
              </span>
              <div className="mt-3 text-right space-y-1">
                <div>
                  <span className="text-stone-500 font-medium">Invoice No:</span>{' '}
                  <span className="font-mono font-bold text-stone-900">{invoiceNo}</span>
                </div>
                <div>
                  <span className="text-stone-500 font-medium">Invoice Date:</span>{' '}
                  <span className="font-medium text-stone-900">{invoiceDate}</span>
                </div>
                <div>
                  <span className="text-stone-500 font-medium">Order Ref:</span>{' '}
                  <span className="font-mono text-stone-700">#{order.id.slice(0, 10)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Billed To / Shipped To */}
          <div className="grid grid-cols-2 gap-8 py-6 border-b border-stone-200">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                Billed To
              </div>
              <div className="font-bold text-sm text-stone-900">{order.customer_name}</div>
              <div className="text-stone-600 mt-1 leading-relaxed">
                <div>{order.customer_email}</div>
                {order.customer_phone && <div>Phone: {order.customer_phone}</div>}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                Shipped To
              </div>
              <div className="font-bold text-stone-900">
                {order.shipping_address?.fullName || order.customer_name}
              </div>
              <div className="text-stone-600 mt-1 leading-relaxed">
                <div>{order.shipping_address?.line1}</div>
                {order.shipping_address?.line2 && <div>{order.shipping_address?.line2}</div>}
                <div>
                  {order.shipping_address?.city}, {order.shipping_address?.state}{' '}
                  {order.shipping_address?.postalCode}
                </div>
                <div>{order.shipping_address?.country || 'India'}</div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-300 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  <th className="py-2 w-10">#</th>
                  <th className="py-2">Item Description</th>
                  <th className="py-2 text-right">Unit Price</th>
                  <th className="py-2 text-center w-16">Qty</th>
                  <th className="py-2 text-right w-24">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {items.map((item, idx) => (
                  <tr key={item.id} className="text-stone-800">
                    <td className="py-3 text-stone-400">{idx + 1}</td>
                    <td className="py-3 font-medium text-stone-900">{item.title}</td>
                    <td className="py-3 text-right text-stone-600">{inr(item.unit_price)}</td>
                    <td className="py-3 text-center text-stone-700">{item.quantity}</td>
                    <td className="py-3 text-right font-medium text-stone-900">
                      {inr(item.unit_price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Tax Breakdown */}
          <div className="pt-4 border-t-2 border-stone-200 flex justify-between items-start">
            <div className="max-w-xs space-y-1 text-[11px] text-stone-500">
              <div className="font-bold text-stone-700">Payment Information:</div>
              <div>Mode: Online via Razorpay</div>
              <div>Order ID: {order.razorpay_order_id || 'N/A'}</div>
              <div>Payment ID: {order.razorpay_payment_id || 'Captured'}</div>
              <div className="pt-2 text-[10px] text-stone-400">
                Thank you for your purchase.{store?.email ? ` For support, contact us at ${store.email}` : ''}
              </div>
            </div>

            <div className="w-64 space-y-2">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span>{inr(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Tax (GST inclusive)</span>
                <span>{inr(invoice?.tax_total || 0)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Shipping</span>
                <span className="text-emerald-700 font-medium">Free</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-stone-900 pt-2 border-t border-stone-300">
                <span>Total Due</span>
                <span>{inr(order.subtotal)}</span>
              </div>
            </div>
          </div>

          {/* Signoff */}
          <div className="mt-12 pt-6 border-t border-dashed border-stone-200 flex justify-between items-end text-[10px] text-stone-400">
            <div>This is a computer generated tax invoice.</div>
            <div className="text-right">
              <div className="font-serif font-bold text-xs text-stone-800">
                For Hilo Arte Studio
              </div>
              <div className="mt-4 text-stone-500">Authorized Signatory</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
