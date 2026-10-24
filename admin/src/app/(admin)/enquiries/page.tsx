'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { Enquiry, EnquiryKind } from '@/lib/types';
import { listEnquiries, setEnquiryHandled } from '@/lib/api';
import { timeAgo, when, whenTime } from '@/lib/format';
import {
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Mail,
  Copy,
  Check,
  Reply,
  Sparkles,
  Calendar,
  AlertCircle,
  Loader2,
  RefreshCw,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'unhandled' | 'handled' | 'contact' | 'workshop'>('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Expanded Message Cards
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const fetchEnquiries = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listEnquiries();
      setEnquiries(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch enquiries.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  // Toggle Handled State
  const handleToggleHandled = async (enquiry: Enquiry) => {
    const nextState = !enquiry.handled;
    setTogglingId(enquiry.id);
    try {
      await setEnquiryHandled(enquiry.id, nextState);
      // Optimistic update
      setEnquiries((prev) =>
        prev.map((e) => (e.id === enquiry.id ? { ...e, handled: nextState } : e))
      );
      setActionSuccess(
        nextState
          ? `Marked enquiry from "${enquiry.name}" as handled.`
          : `Marked enquiry from "${enquiry.name}" as unhandled.`
      );
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update enquiry.';
      alert(msg);
    } finally {
      setTogglingId(null);
    }
  };

  const copyEmail = (email: string, id: string) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = enquiries.length;
    const unhandled = enquiries.filter((e) => !e.handled).length;
    const handled = enquiries.filter((e) => e.handled).length;
    const contact = enquiries.filter((e) => e.kind === 'contact').length;
    const workshop = enquiries.filter((e) => e.kind === 'workshop').length;
    return { total, unhandled, handled, contact, workshop };
  }, [enquiries]);

  // Filtered list
  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((item) => {
      let matchesTab = true;
      if (filterTab === 'unhandled') matchesTab = !item.handled;
      else if (filterTab === 'handled') matchesTab = item.handled;
      else if (filterTab === 'contact') matchesTab = item.kind === 'contact';
      else if (filterTab === 'workshop') matchesTab = item.kind === 'workshop';

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.message.toLowerCase().includes(q);

      return matchesTab && matchesSearch;
    });
  }, [enquiries, filterTab, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-stone-900 tracking-tight">
            Enquiries
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Customer inquiries, custom kit requests, and workshop questions.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchEnquiries}
            disabled={loading}
            className="inline-flex items-center space-x-2 border border-stone-200 bg-white px-3.5 py-2 rounded-lg text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors shadow-2xs"
            title="Refresh enquiries list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Total Messages
          </div>
          <div className="text-2xl font-bold text-stone-900 mt-1.5">{stats.total}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-2xs bg-amber-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
              Needs Attention
            </span>
            {stats.unhandled > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </div>
          <div className="text-2xl font-bold text-amber-900 mt-1.5">
            {stats.unhandled}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200/80 shadow-2xs bg-emerald-50/20">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
            Handled
          </div>
          <div className="text-2xl font-bold text-emerald-900 mt-1.5">{stats.handled}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-purple-200/80 shadow-2xs bg-purple-50/20">
          <div className="text-xs font-semibold uppercase tracking-wider text-purple-800">
            Workshop Inquiries
          </div>
          <div className="text-2xl font-bold text-purple-900 mt-1.5">
            {stats.workshop}
          </div>
        </div>
      </div>

      {/* Feedback Alert */}
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

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center overflow-x-auto pb-1 md:pb-0 gap-1.5 text-xs font-medium scrollbar-none">
            {[
              { id: 'all', label: 'All Messages', count: stats.total },
              { id: 'unhandled', label: 'Unhandled', count: stats.unhandled, highlight: stats.unhandled > 0 },
              { id: 'handled', label: 'Handled', count: stats.handled },
              { id: 'contact', label: 'Store Contact', count: stats.contact },
              { id: 'workshop', label: 'Workshop', count: stats.workshop },
            ].map((tab) => {
              const active = filterTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterTab(tab.id as typeof filterTab)}
                  className={`inline-flex items-center px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-stone-900 text-white font-semibold'
                      : tab.highlight
                      ? 'bg-amber-100 text-amber-900 hover:bg-amber-200/70'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${
                      active
                        ? 'bg-stone-700 text-white'
                        : tab.highlight
                        ? 'bg-amber-200 text-amber-950 font-bold'
                        : 'bg-stone-200 text-stone-700'
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
              placeholder="Search sender, email, inquiry text..."
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

      {/* Enquiries List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-xl border border-stone-200/80 p-16 text-center text-stone-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-stone-400 mb-3" />
            <p className="text-sm">Loading enquiries...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl border border-stone-200/80 p-12 text-center">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
            <p className="text-sm text-stone-700 font-medium">Failed to load enquiries</p>
            <p className="text-xs text-rose-600 mt-1">{error}</p>
            <button
              onClick={fetchEnquiries}
              className="mt-4 px-4 py-1.5 bg-stone-900 text-white text-xs font-medium rounded-lg hover:bg-stone-800"
            >
              Retry
            </button>
          </div>
        ) : filteredEnquiries.length === 0 ? (
          <div className="bg-white rounded-xl border border-stone-200/80 p-16 text-center text-stone-500">
            <MessageSquare className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <p className="text-base font-medium text-stone-800">No enquiries found</p>
            <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">
              {searchQuery || filterTab !== 'all'
                ? 'Try resetting your search query or filter.'
                : 'Customer questions submitted on the contact and workshop pages will show here.'}
            </p>
            {(searchQuery || filterTab !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterTab('all');
                }}
                className="mt-4 px-3 py-1.5 border border-stone-200 text-xs font-medium rounded-lg hover:bg-stone-50 text-stone-700"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          filteredEnquiries.map((enq) => {
            const isUnhandled = !enq.handled;
            const isExpanded = expandedIds.has(enq.id);
            const isLong = enq.message.length > 200;

            const mailtoHref = `mailto:${enq.email}?subject=${encodeURIComponent(
              `Re: Your enquiry with Hilo Arte`
            )}&body=${encodeURIComponent(
              `Hi ${enq.name},\n\nThank you for reaching out to Hilo Arte!\n\nRegarding your message:\n> "${enq.message}"\n\n`
            )}`;

            return (
              <div
                key={enq.id}
                className={`bg-white rounded-xl border transition-all shadow-2xs hover:shadow-xs ${
                  isUnhandled
                    ? 'border-amber-300/80 bg-linear-to-r from-amber-50/20 to-white'
                    : 'border-stone-200/80'
                }`}
              >
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Sender & Badges */}
                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0 ${
                          isUnhandled
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : 'bg-stone-100 text-stone-700 border border-stone-200'
                        }`}
                      >
                        {enq.name.slice(0, 2)}
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-bold text-stone-900">{enq.name}</h3>

                          {/* Kind Badge */}
                          {enq.kind === 'workshop' ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>Workshop</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-sky-50 text-sky-700 border border-sky-200">
                              <MessageSquare className="w-2.5 h-2.5" />
                              <span>Contact</span>
                            </span>
                          )}

                          {/* Status Badge */}
                          {isUnhandled ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="w-2.5 h-2.5" />
                              <span>Needs Attention</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>Handled</span>
                            </span>
                          )}
                        </div>

                        {/* Email & Date */}
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-stone-500 mt-1">
                          <span className="text-stone-700 font-medium">{enq.email}</span>
                          <button
                            onClick={() => copyEmail(enq.email, enq.id)}
                            className="text-stone-400 hover:text-stone-700 inline-flex items-center"
                            title="Copy email address"
                          >
                            {copiedId === enq.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                          <span>•</span>
                          <span>{timeAgo(enq.created_at)}</span>
                          <span className="hidden sm:inline">({whenTime(enq.created_at)})</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions: Handled Toggle & Reply */}
                    <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                      <a
                        href={mailtoHref}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors border border-stone-200/80"
                      >
                        <Reply className="w-3.5 h-3.5" />
                        <span>Reply</span>
                      </a>

                      <button
                        onClick={() => handleToggleHandled(enq)}
                        disabled={togglingId === enq.id}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
                          isUnhandled
                            ? 'bg-amber-600 text-white hover:bg-amber-700 border-amber-600 shadow-2xs'
                            : 'bg-white text-stone-700 hover:bg-stone-50 border-stone-200'
                        }`}
                      >
                        {togglingId === enq.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isUnhandled ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Mark Handled</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 text-stone-400" />
                            <span>Mark Unhandled</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="mt-3.5 pt-3 border-t border-stone-100">
                    <p
                      className={`text-sm text-stone-700 leading-relaxed font-sans whitespace-pre-line ${
                        !isExpanded && isLong ? 'line-clamp-2' : ''
                      }`}
                    >
                      {enq.message}
                    </p>

                    {isLong && (
                      <button
                        onClick={() => toggleExpand(enq.id)}
                        className="mt-1 text-xs text-stone-500 hover:text-stone-800 font-medium inline-flex items-center space-x-1"
                      >
                        <span>{isExpanded ? 'Show less' : 'Read full message'}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
