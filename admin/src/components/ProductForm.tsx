'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  createProduct,
  deleteImageByUrl,
  listCollections,
  updateProduct,
  uploadImageFile,
} from '@/lib/api';
import { isValidHandle, slugify } from '@/lib/slug';
import type { Product, ProductInput, Collection, ImageAsset, DifficultyLevel, FAQItem } from '@/lib/types';
import {
  Upload,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Sparkles,
  HelpCircle,
  Package,
} from 'lucide-react';
import Link from 'next/link';

interface ProductFormProps {
  initialProduct?: Product;
  isEdit?: boolean;
}

export function ProductForm({ initialProduct, isEdit = false }: ProductFormProps) {
  const router = useRouter();

  // Basic Details
  const [title, setTitle] = useState(initialProduct?.title || '');
  const [handle, setHandle] = useState(initialProduct?.handle || '');
  const [subtitle, setSubtitle] = useState(initialProduct?.subtitle || '');
  const [price, setPrice] = useState<number | string>(initialProduct?.price ?? '');
  const [currencyCode, setCurrencyCode] = useState(initialProduct?.currency_code || 'INR');
  const [stock, setStock] = useState<number | string>(initialProduct?.stock ?? '');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(initialProduct?.difficulty || 'Beginner');
  const [estimatedHours, setEstimatedHours] = useState<number | string>(initialProduct?.estimated_hours ?? '');

  // Status & Badges
  const [published, setPublished] = useState<boolean>(initialProduct?.published ?? false);
  const [isBestSeller, setIsBestSeller] = useState<boolean>(initialProduct?.is_best_seller ?? false);
  const [isFeatured, setIsFeatured] = useState<boolean>(initialProduct?.is_featured ?? false);

  // Content
  const [shortDescription, setShortDescription] = useState(initialProduct?.short_description || '');
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [shippingInfo, setShippingInfo] = useState(initialProduct?.shipping_info || '');

  // Collections & Tags
  const [availableCollections, setAvailableCollections] = useState<Collection[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>(initialProduct?.collections || []);
  const [tagsInput, setTagsInput] = useState<string>(initialProduct?.tags?.join(', ') || '');

  // What's Included (Array of strings)
  const [whatsIncluded, setWhatsIncluded] = useState<string[]>(
    initialProduct?.whats_included?.length ? initialProduct.whats_included : ['']
  );

  // FAQs (Array of { question, answer })
  const [faqs, setFaqs] = useState<FAQItem[]>(initialProduct?.faqs || []);

  // Images
  const [images, setImages] = useState<ImageAsset[]>(initialProduct?.images || []);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [manualImageUrl, setManualImageUrl] = useState('');

  // Form State
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [created, setCreated] = useState(false);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    },
    []
  );

  // Fetch collections for multi-select
  useEffect(() => {
    async function loadCollections() {
      try {
        setAvailableCollections(await listCollections('title'));
      } catch (err) {
        console.error('Failed to load collections:', err);
      }
    }
    loadCollections();
  }, []);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEdit && (!handle || handle === slugify(title))) {
      setHandle(slugify(val));
    }
  };

  // Image Upload Handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    setError(null);
    try {
      // Add each file as soon as it uploads so a later failure doesn't orphan the earlier ones.
      for (let i = 0; i < files.length; i++) {
        const asset = await uploadImageFile(files[i], 'products');
        setImages((prev) => [...prev, asset]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to upload image.';
      setError(msg);
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleAddManualImage = () => {
    if (!manualImageUrl.trim()) return;
    setImages((prev) => [
      ...prev,
      {
        url: manualImageUrl.trim(),
        altText: title || 'Product image',
      },
    ]);
    setManualImageUrl('');
  };

  const removeImage = (index: number) => {
    const removed = images[index];
    setImages((prev) => prev.filter((_, i) => i !== index));
    // Files saved with the product are deleted on save; ones uploaded in this session can go now.
    if (removed && !initialProduct?.images?.some((img) => img.url === removed.url)) {
      void deleteImageByUrl(removed.url);
    }
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const newImages = [...images];
    const [moved] = newImages.splice(index, 1);
    newImages.splice(targetIndex, 0, moved);
    setImages(newImages);
  };

  // What's Included Helpers
  const addIncludedItem = () => setWhatsIncluded((prev) => [...prev, '']);
  const updateIncludedItem = (index: number, val: string) =>
    setWhatsIncluded((prev) => prev.map((item, i) => (i === index ? val : item)));
  const removeIncludedItem = (index: number) =>
    setWhatsIncluded((prev) => prev.filter((_, i) => i !== index));

  // FAQ Helpers
  const addFaq = () => setFaqs((prev) => [...prev, { question: '', answer: '' }]);
  const updateFaq = (index: number, field: 'question' | 'answer', val: string) =>
    setFaqs((prev) => prev.map((faq, i) => (i === index ? { ...faq, [field]: val } : faq)));
  const removeFaq = (index: number) => setFaqs((prev) => prev.filter((_, i) => i !== index));

  // Collection checkbox toggle
  const toggleCollection = (colHandle: string) => {
    setSelectedCollections((prev) =>
      prev.includes(colHandle) ? prev.filter((h) => h !== colHandle) : [...prev, colHandle]
    );
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !handle.trim()) {
      setError('Product title and URL handle are required.');
      return;
    }
    if (!isValidHandle(handle.trim())) {
      setError('Handle may only use lowercase letters, numbers and single hyphens (e.g. blooming-roses).');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const filteredIncluded = whatsIncluded.map((s) => s.trim()).filter(Boolean);
    const filteredFaqs = faqs
      .map((f) => ({ question: f.question.trim(), answer: f.answer.trim() }))
      .filter((f) => f.question && f.answer);

    const payload: ProductInput = {
      title: title.trim(),
      handle: handle.trim(),
      subtitle: subtitle.trim() || null,
      description: description.trim(),
      short_description: shortDescription.trim(),
      price: Number(price),
      currency_code: currencyCode,
      difficulty,
      estimated_hours: Number(estimatedHours) || 0,
      images,
      collections: selectedCollections,
      tags,
      whats_included: filteredIncluded,
      shipping_info: shippingInfo.trim(),
      faqs: filteredFaqs,
      is_best_seller: isBestSeller,
      is_featured: isFeatured,
      stock: Number(stock),
      published,
    };

    try {
      if (isEdit && initialProduct) {
        // Leave stock out unless it was edited, so orders placed while this page was open aren't undone.
        const { stock: nextStock, ...rest } = payload;
        await updateProduct(
          initialProduct.id,
          nextStock !== initialProduct.stock ? payload : rest
        );
        const kept = new Set(images.map((img) => img.url));
        await Promise.all(
          (initialProduct.images || [])
            .filter((img) => !kept.has(img.url))
            .map((img) => deleteImageByUrl(img.url))
        );
        setSuccess('Product updated successfully!');
      } else {
        await createProduct(payload);
        setCreated(true);
        setSuccess('Product created successfully!');
        redirectTimer.current = setTimeout(() => router.push('/products'), 1200);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Save operation failed.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-16">
      {/* Notifications */}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-800 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sticky top-16 bg-stone-50/90 backdrop-blur-md py-3 z-20 border-b border-stone-200">
        <div>
          <h2 className="text-xl font-bold font-serif text-stone-900">
            {isEdit ? `Edit: ${initialProduct?.title}` : 'New Product'}
          </h2>
          <p className="text-xs text-stone-500">
            {isEdit ? 'Update product details and sync stock levels' : 'Add a new kit or item to your storefront'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/products"
            className="px-4 py-2 border border-stone-300 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-100 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || created}
            className="inline-flex items-center space-x-2 px-5 py-2 bg-[#380b0c] hover:bg-[#4d1012] text-white rounded-lg text-sm font-medium shadow-xs transition disabled:opacity-60"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isEdit ? 'Save Changes' : 'Create Product'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section: Basic Information */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-2xs space-y-4">
            <h3 className="font-semibold text-base text-stone-900">Product Information</h3>

            <div>
              <label className="block text-xs font-semibold uppercase text-stone-700 mb-1.5">
                Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Blooming Roses DIY Embroidery Kit"
                className="w-full px-3.5 py-2.5 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#380b0c]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-stone-700 mb-1.5">
                Handle (URL Slug) *
              </label>
              <div className="flex rounded-lg border border-stone-300 overflow-hidden text-sm focus-within:ring-2 focus-within:ring-[#380b0c]">
                <span className="bg-stone-100 px-3 py-2 text-stone-500 font-mono text-xs border-r border-stone-300">
                  /products/
                </span>
                <input
                  type="text"
                  required
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  title="Lowercase letters, numbers and single hyphens"
                  placeholder="blooming-roses"
                  className="flex-1 px-3 py-2 focus:outline-none font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-stone-700 mb-1.5">
                Subtitle / Tagline
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Complete embroidery starter kit with pre-printed linen"
                className="w-full px-3.5 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#380b0c]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-stone-700 mb-1.5">
                Short Description
              </label>
              <textarea
                rows={2}
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Brief summary for product cards and search results..."
                className="w-full px-3.5 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#380b0c]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-stone-700 mb-1.5">
                Full Description
              </label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed craft narrative and product overview..."
                className="w-full px-3.5 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#380b0c]"
              />
            </div>
          </div>

          {/* Section: Image Gallery */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base text-stone-900">Media Gallery</h3>
                <p className="text-xs text-stone-500">
                  Upload images or provide image URLs. First image serves as the main storefront thumbnail.
                </p>
              </div>
              <label className="inline-flex items-center space-x-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition">
                {uploadingImage ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#380b0c]" />
                ) : (
                  <Upload className="w-3.5 h-3.5 text-[#380b0c]" />
                )}
                <span>Upload Images</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>
            </div>

            {/* Quick URL Adder */}
            <div className="flex items-center space-x-2 pt-1">
              <input
                type="text"
                placeholder="Or paste external image URL..."
                value={manualImageUrl}
                onChange={(e) => setManualImageUrl(e.target.value)}
                className="flex-1 px-3 py-1.5 border border-stone-300 rounded-lg text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddManualImage}
                className="px-3 py-1.5 bg-stone-800 text-white rounded-lg text-xs font-medium hover:bg-black transition"
              >
                Add URL
              </button>
            </div>

            {/* Images Grid */}
            {images.length === 0 ? (
              <div className="border border-dashed border-stone-300 rounded-xl p-8 text-center bg-stone-50">
                <ImageIcon className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                <p className="text-xs text-stone-500">No images added yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative group border border-stone-200 rounded-xl overflow-hidden bg-stone-100 flex flex-col"
                  >
                    <div className="h-32 w-full relative">
                      <img
                        src={img.url}
                        alt={img.altText || `Product image ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {idx === 0 && (
                        <span className="absolute top-2 left-2 bg-[#380b0c] text-white text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded shadow">
                          Thumbnail
                        </span>
                      )}
                    </div>
                    {/* Controls */}
                    <div className="p-2 bg-white flex items-center justify-between border-t border-stone-100">
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => moveImage(idx, 'up')}
                          disabled={idx === 0}
                          title="Move earlier"
                          className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-30 rounded hover:bg-stone-100"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImage(idx, 'down')}
                          disabled={idx === images.length - 1}
                          title="Move later"
                          className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-30 rounded hover:bg-stone-100"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        title="Remove image"
                        className="p-1 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Kit Details & Specs */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-2xs space-y-4">
            <h3 className="font-semibold text-base text-stone-900">Kit Specifications</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-stone-700 mb-1.5">
                  Difficulty Level
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                  className="w-full px-3.5 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#380b0c]"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-stone-700 mb-1.5">
                  Estimated Completion (Hours)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  className="w-full px-3.5 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#380b0c]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-stone-700 mb-1.5">
                Shipping Information Note
              </label>
              <textarea
                rows={2}
                value={shippingInfo}
                onChange={(e) => setShippingInfo(e.target.value)}
                className="w-full px-3.5 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#380b0c]"
              />
            </div>
          </div>

          {/* Section: What's Included */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base text-stone-900">What&apos;s Inside the Box</h3>
                <p className="text-xs text-stone-500">Materials and accessories included in this package.</p>
              </div>
              <button
                type="button"
                onClick={addIncludedItem}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#380b0c] bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2 pt-1">
              {whatsIncluded.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <span className="text-xs text-stone-400 font-mono w-5 text-right">{idx + 1}.</span>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateIncludedItem(idx, e.target.value)}
                    placeholder="e.g. 8-inch Bamboo Embroidery Hoop"
                    className="flex-1 px-3 py-1.5 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#380b0c]"
                  />
                  <button
                    type="button"
                    onClick={() => removeIncludedItem(idx)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 rounded-md transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section: FAQs */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base text-stone-900">Frequently Asked Questions</h3>
                <p className="text-xs text-stone-500">Displayed on the product detail page accordion.</p>
              </div>
              <button
                type="button"
                onClick={addFaq}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#380b0c] bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add FAQ</span>
              </button>
            </div>

            <div className="space-y-4 pt-1">
              {faqs.map((faq, idx) => (
                <div key={idx} className="p-4 border border-stone-200 rounded-xl space-y-2.5 bg-stone-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                      Question #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFaq(idx)}
                      className="text-stone-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => updateFaq(idx, 'question', e.target.value)}
                    placeholder="Question (e.g. Do I need extra tools?)"
                    className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-sm focus:outline-none"
                  />
                  <textarea
                    rows={2}
                    value={faq.answer}
                    onChange={(e) => updateFaq(idx, 'answer', e.target.value)}
                    placeholder="Detailed helpful answer..."
                    className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-sm focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Pricing, Stock, Organization */}
        <div className="space-y-6">
          {/* Section: Status & Visibility */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-2xs space-y-4">
            <h3 className="font-semibold text-base text-stone-900">Publishing Status</h3>

            <div className="flex items-center justify-between py-2 border-b border-stone-100">
              <div>
                <p className="text-sm font-medium text-stone-800">Published to Store</p>
                <p className="text-xs text-stone-500">Make visible on the live catalog</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#380b0c]" />
              </label>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-stone-100">
              <div>
                <p className="text-sm font-medium text-stone-800">Best Seller</p>
                <p className="text-xs text-stone-500">Showcases on homepage highlights</p>
              </div>
              <input
                type="checkbox"
                checked={isBestSeller}
                onChange={(e) => setIsBestSeller(e.target.checked)}
                className="w-4 h-4 rounded text-[#380b0c] focus:ring-[#380b0c]"
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-stone-800">Featured Item</p>
                <p className="text-xs text-stone-500">Priority placement across grids</p>
              </div>
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded text-[#380b0c] focus:ring-[#380b0c]"
              />
            </div>
          </div>

          {/* Section: Pricing & Stock */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-2xs space-y-4">
            <h3 className="font-semibold text-base text-stone-900">Pricing & Inventory</h3>

            <div>
              <label className="block text-xs font-semibold uppercase text-stone-700 mb-1.5">
                Price (INR ₹) *
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500 font-medium">
                  ₹
                </span>
                <input
                  type="number"
                  required
                  min="0"
                  step="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="block w-full pl-8 pr-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#380b0c]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-stone-700 mb-1.5">
                Current Stock (Units) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="1"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="block w-full px-3.5 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#380b0c]"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                Stock is decremented automatically upon completed orders.
              </p>
            </div>
          </div>

          {/* Section: Categorization */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-2xs space-y-4">
            <h3 className="font-semibold text-base text-stone-900">Collections</h3>
            <p className="text-xs text-stone-500">Assign to one or more storefront categories.</p>

            {availableCollections.length === 0 ? (
              <p className="text-xs text-stone-400">No collections created yet.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableCollections.map((col) => (
                  <label key={col.id} className="flex items-center space-x-2.5 text-sm text-stone-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCollections.includes(col.handle)}
                      onChange={() => toggleCollection(col.handle)}
                      className="rounded text-[#380b0c] focus:ring-[#380b0c] w-4 h-4"
                    />
                    <span>{col.title}</span>
                  </label>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-stone-100">
              <label className="block text-xs font-semibold uppercase text-stone-700 mb-1.5">
                Tags (Comma-separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="embroidery, floral, beginner, gift"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#380b0c]"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
