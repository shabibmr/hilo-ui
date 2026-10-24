'use client';

import React, { useEffect, useState } from 'react';
import type { HeroContent, ImageAsset, SiteSettings, SocialLinks, StoreProfile } from '@/lib/types';
import { getSiteSettings, saveSiteSettings, uploadImageFile } from '@/lib/api';
import { whenTime } from '@/lib/format';
import {
  Settings,
  Megaphone,
  Sparkles,
  Building2,
  Share2,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Upload,
  Image as ImageIcon,
  ExternalLink,
  Eye,
  RefreshCw,
} from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Announcement Bar
  const [announcement, setAnnouncement] = useState('');
  const [loadFailed, setLoadFailed] = useState(false);

  // Hero Section
  const [heroEyebrow, setHeroEyebrow] = useState('');
  const [heroHeadline, setHeroHeadline] = useState('');
  const [heroSubheadline, setHeroSubheadline] = useState('');
  const [heroPrimaryCtaText, setHeroPrimaryCtaText] = useState('');
  const [heroPrimaryCtaLink, setHeroPrimaryCtaLink] = useState('');
  const [heroSecondaryCtaText, setHeroSecondaryCtaText] = useState('');
  const [heroSecondaryCtaLink, setHeroSecondaryCtaLink] = useState('');
  const [heroBgUrl, setHeroBgUrl] = useState('');
  const [heroBgAlt, setHeroBgAlt] = useState('');
  const [uploadingBg, setUploadingBg] = useState(false);

  // Store Profile
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeEmail, setStoreEmail] = useState('');
  const [storeHours, setStoreHours] = useState('');
  const [storeGstin, setStoreGstin] = useState('');

  // Social Links
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialPinterest, setSocialPinterest] = useState('');
  const [socialWhatsapp, setSocialWhatsapp] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSiteSettings();
      setLastUpdated(data.updated_at);

      // Announcement
      setAnnouncement(data.announcement || '');
      setLoadFailed(false);

      // Hero
      setHeroEyebrow(data.hero?.eyebrow || '');
      setHeroHeadline(data.hero?.headline || '');
      setHeroSubheadline(data.hero?.subheadline || '');
      setHeroPrimaryCtaText(data.hero?.primaryCtaText || '');
      setHeroPrimaryCtaLink(data.hero?.primaryCtaLink || '');
      setHeroSecondaryCtaText(data.hero?.secondaryCtaText || '');
      setHeroSecondaryCtaLink(data.hero?.secondaryCtaLink || '');
      setHeroBgUrl(data.hero?.backgroundImage?.url || '');
      setHeroBgAlt(data.hero?.backgroundImage?.altText || '');

      // Store
      setStoreName(data.store?.name || '');
      setStoreAddress(data.store?.address || '');
      setStorePhone(data.store?.phone || '');
      setStoreEmail(data.store?.email || '');
      setStoreHours(data.store?.hours || '');
      setStoreGstin(data.store?.gstin || '');

      // Social
      setSocialInstagram(data.social?.instagram || '');
      setSocialPinterest(data.social?.pinterest || '');
      setSocialWhatsapp(data.social?.whatsapp || '');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch site settings.';
      setError(msg);
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBg(true);
    try {
      const asset = await uploadImageFile(file, 'hero');
      setHeroBgUrl(asset.url);
      setHeroBgAlt(asset.altText || 'Hero background');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to upload background image.';
      alert(msg);
    } finally {
      setUploadingBg(false);
    }
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const hero: HeroContent = {
        eyebrow: heroEyebrow.trim(),
        headline: heroHeadline.trim(),
        subheadline: heroSubheadline.trim(),
        primaryCtaText: heroPrimaryCtaText.trim(),
        primaryCtaLink: heroPrimaryCtaLink.trim(),
        secondaryCtaText: heroSecondaryCtaText.trim(),
        secondaryCtaLink: heroSecondaryCtaLink.trim(),
        backgroundImage: heroBgUrl
          ? {
              url: heroBgUrl.trim(),
              altText: heroBgAlt.trim() || 'Hero background',
            }
          : null,
      };

      const store: StoreProfile = {
        name: storeName.trim(),
        address: storeAddress.trim(),
        phone: storePhone.trim(),
        email: storeEmail.trim(),
        hours: storeHours.trim(),
        gstin: storeGstin.trim(),
      };

      const social: SocialLinks = {
        instagram: socialInstagram.trim(),
        pinterest: socialPinterest.trim(),
        whatsapp: socialWhatsapp.trim(),
      };

      await saveSiteSettings({
        hero,
        store,
        social,
        announcement: announcement.trim() || null,
      });

      setLastUpdated(new Date().toISOString());
      setSuccessMsg('Site settings successfully saved and applied!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save site settings.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-stone-200/80 p-20 text-center text-stone-500">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-stone-400 mb-3" />
        <p className="text-sm">Loading storefront settings...</p>
      </div>
    );
  }

  if (loadFailed) {
    // Never show the editable form after a failed load: saving would overwrite live content with blanks.
    return (
      <div className="bg-white rounded-xl border border-rose-200 p-12 text-center">
        <AlertCircle className="w-8 h-8 mx-auto text-rose-500 mb-3" />
        <p className="text-sm text-rose-800 mb-4">{error}</p>
        <button
          type="button"
          onClick={fetchSettings}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-[#380b0c] text-white rounded-lg text-sm font-medium hover:bg-[#4d1012]"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSaveAll} className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-stone-900 tracking-tight">
            Site Settings
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Manage storefront announcement banner, hero showcase, store identity, and
            social links.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {lastUpdated && (
            <span className="text-xs text-stone-400 hidden sm:inline">
              Saved {whenTime(lastUpdated)}
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center space-x-2 bg-[#380b0c] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#4d1012] transition-colors shadow-xs disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save All Settings</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Section 1: Announcement Bar */}
      <div className="bg-white rounded-xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900">Announcement Banner</h2>
              <p className="text-xs text-stone-500">
                Shown at the very top of every storefront page.
              </p>
            </div>
          </div>

          <span className="text-xs text-stone-500">Leave empty to hide the banner</span>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Banner Text
            </label>
            <input
              type="text"
              placeholder="e.g. Complimentary gift packaging on all orders above ₹1,500. Free shipping across India."
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              className="w-full text-sm px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-stone-400 focus:bg-white transition-all"
            />
          </div>

          {/* Live Preview */}
          {announcement.trim() && (
            <div className="bg-[#380b0c] text-amber-100 py-2 px-4 rounded-lg text-center text-xs tracking-wider font-medium shadow-inner flex items-center justify-center space-x-2">
              <span className="text-[10px] uppercase font-bold tracking-widest bg-amber-950/60 text-amber-200 px-2 py-0.5 rounded">
                Live Store Preview
              </span>
              <span>{announcement}</span>
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Homepage Hero Showcase */}
      <div className="bg-white rounded-xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center space-x-2.5 bg-stone-50/50">
          <div className="p-1.5 bg-purple-100 text-purple-800 rounded-lg">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-stone-900">Homepage Hero Showcase</h2>
            <p className="text-xs text-stone-500">
              Primary brand statement, headline, and call-to-action buttons.
            </p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Eyebrow Text
              </label>
              <input
                type="text"
                placeholder="e.g. Luxury creative experiences"
                value={heroEyebrow}
                onChange={(e) => setHeroEyebrow(e.target.value)}
                className="w-full text-sm px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-stone-400 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Primary Headline
              </label>
              <input
                type="text"
                placeholder="e.g. Stitch beauty into your quiet moments."
                value={heroHeadline}
                onChange={(e) => setHeroHeadline(e.target.value)}
                className="w-full text-sm px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-stone-400 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Subheadline / Description
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Beginner embroidery kits designed with pure linen, beechwood hoops, and metallic threads made to slow an evening down."
              value={heroSubheadline}
              onChange={(e) => setHeroSubheadline(e.target.value)}
              className="w-full text-sm px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-stone-400 focus:bg-white leading-relaxed"
            />
          </div>

          {/* CTA Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Primary CTA */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/80 space-y-3">
              <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                Primary Call-To-Action
              </span>
              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1">
                  Button Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. Start your first stitch"
                  value={heroPrimaryCtaText}
                  onChange={(e) => setHeroPrimaryCtaText(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 bg-white border border-stone-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1">
                  Target Link
                </label>
                <input
                  type="text"
                  placeholder="e.g. /collections/diy-kits"
                  value={heroPrimaryCtaLink}
                  onChange={(e) => setHeroPrimaryCtaLink(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 bg-white border border-stone-200 rounded-lg font-mono"
                />
              </div>
            </div>

            {/* Secondary CTA */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/80 space-y-3">
              <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                Secondary Call-To-Action
              </span>
              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1">
                  Button Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. Explore gift experiences"
                  value={heroSecondaryCtaText}
                  onChange={(e) => setHeroSecondaryCtaText(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 bg-white border border-stone-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-stone-600 mb-1">
                  Target Link
                </label>
                <input
                  type="text"
                  placeholder="e.g. /collections/gift-experiences"
                  value={heroSecondaryCtaLink}
                  onChange={(e) => setHeroSecondaryCtaLink(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 bg-white border border-stone-200 rounded-lg font-mono"
                />
              </div>
            </div>
          </div>

          {/* Hero Background Image */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Hero Background Image
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {heroBgUrl ? (
                <div className="relative w-36 h-24 rounded-lg overflow-hidden border border-stone-300 bg-stone-100 shrink-0">
                  <img
                    src={heroBgUrl}
                    alt={heroBgAlt || 'Hero preview'}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setHeroBgUrl('');
                      setHeroBgAlt('');
                    }}
                    className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 hover:bg-black"
                    title="Remove background image"
                  >
                    <span className="text-xs leading-none">✕</span>
                  </button>
                </div>
              ) : (
                <div className="w-36 h-24 rounded-lg border-2 border-dashed border-stone-300 flex flex-col items-center justify-center text-stone-400 shrink-0">
                  <ImageIcon className="w-6 h-6 mb-1" />
                  <span className="text-[10px]">No image set</span>
                </div>
              )}

              <div className="flex-1 space-y-2">
                <div className="flex items-center space-x-2">
                  <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-stone-300 hover:bg-stone-50 rounded-lg text-xs font-medium text-stone-700 shadow-2xs">
                    {uploadingBg ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{uploadingBg ? 'Uploading...' : 'Upload Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleHeroImageUpload}
                      disabled={uploadingBg}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-stone-400">or enter direct URL below:</span>
                </div>

                <input
                  type="text"
                  placeholder="https://... or /images/hero/hero-fairy-moon.jpg"
                  value={heroBgUrl}
                  onChange={(e) => setHeroBgUrl(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Store Profile & GSTIN */}
      <div className="bg-white rounded-xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center space-x-2.5 bg-stone-50/50">
          <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-stone-900">
              Store Identity & Tax Details
            </h2>
            <p className="text-xs text-stone-500">
              Official store details printed on sales invoices and shown in footer.
            </p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Store Name
              </label>
              <input
                type="text"
                placeholder="e.g. Hilo Arte"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full text-sm px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-stone-400 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                GSTIN Number (for Tax Invoices)
              </label>
              <input
                type="text"
                placeholder="e.g. 27AAPFH1842Q1Z5"
                value={storeGstin}
                onChange={(e) => setStoreGstin(e.target.value)}
                className="w-full text-sm px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-stone-400 focus:bg-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Studio Address
            </label>
            <input
              type="text"
              placeholder="e.g. Studio 4, 18 Hill Road, Bandra West, Mumbai 400050"
              value={storeAddress}
              onChange={(e) => setStoreAddress(e.target.value)}
              className="w-full text-sm px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-stone-400 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Support Email
              </label>
              <input
                type="email"
                placeholder="studio@hiloarte.com"
                value={storeEmail}
                onChange={(e) => setStoreEmail(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-stone-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Support Phone
              </label>
              <input
                type="text"
                placeholder="+91 22 4893 2210"
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-stone-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Operating Hours
              </label>
              <input
                type="text"
                placeholder="Tuesday to Saturday, 11:00 to 18:00"
                value={storeHours}
                onChange={(e) => setStoreHours(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-stone-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Social Channels */}
      <div className="bg-white rounded-xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center space-x-2.5 bg-stone-50/50">
          <div className="p-1.5 bg-sky-100 text-sky-800 rounded-lg">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-stone-900">
              Social Media & Direct Channels
            </h2>
            <p className="text-xs text-stone-500">
              Profiles linked in the storefront footer and contact page.
            </p>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Instagram Profile URL
            </label>
            <input
              type="text"
              placeholder="https://instagram.com/hiloarte"
              value={socialInstagram}
              onChange={(e) => setSocialInstagram(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-stone-400 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Pinterest Profile URL
            </label>
            <input
              type="text"
              placeholder="https://pinterest.com/hiloarte"
              value={socialPinterest}
              onChange={(e) => setSocialPinterest(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-stone-400 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              WhatsApp Contact Number
            </label>
            <input
              type="text"
              placeholder="+91 98200 11024"
              value={socialWhatsapp}
              onChange={(e) => setSocialWhatsapp(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-stone-400 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Sticky Bottom Save Action Bar */}
      <div className="sticky bottom-4 z-20 bg-stone-900 text-white p-4 rounded-xl shadow-xl flex items-center justify-between">
        <div className="text-xs text-stone-300">
          Make sure to click <strong className="text-white">Save All Settings</strong> to
          publish updates to your storefront.
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center space-x-2 bg-amber-400 text-stone-950 px-5 py-2 rounded-lg text-xs font-bold hover:bg-amber-300 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Save All Settings</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
