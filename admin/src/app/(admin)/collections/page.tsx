'use client';

import React, { useEffect, useState } from 'react';
import type { Collection, ImageAsset } from '@/lib/types';
import {
  countProductsInCollection,
  createCollection,
  deleteCollection,
  deleteImageByUrl,
  listCollections,
  setCollectionPublished,
  updateCollection,
  uploadImageFile,
} from '@/lib/api';
import { isValidHandle, slugify } from '@/lib/slug';
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Upload,
  X,
  ExternalLink,
} from 'lucide-react';

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [handle, setHandle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [published, setPublished] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [handleLockedBy, setHandleLockedBy] = useState(0);

  const fetchCollections = async () => {
    setLoading(true);
    setError(null);
    try {
      setCollections(await listCollections());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch collections.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const openCreateModal = () => {
    setEditingCollection(null);
    setTitle('');
    setHandle('');
    setDescription('');
    setImageUrl('');
    setImageAlt('');
    setSortOrder(collections.length);
    setPublished(true);
    setFormError(null);
    setHandleLockedBy(0);
    setModalOpen(true);
  };

  const openEditModal = (col: Collection) => {
    setEditingCollection(col);
    setTitle(col.title);
    setHandle(col.handle);
    setDescription(col.description || '');
    setImageUrl(col.image?.url || '');
    setImageAlt(col.image?.altText || col.title);
    setSortOrder(col.sort_order ?? 0);
    setPublished(col.published ?? true);
    setFormError(null);
    setHandleLockedBy(0);
    setModalOpen(true);
    // Products reference this handle, so it can't change while any use it.
    countProductsInCollection(col.handle)
      .then(setHandleLockedBy)
      .catch((err) => console.error('Could not count products in collection:', err));
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingCollection) {
      // Auto-generate slug
      setHandle(slugify(val));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setFormError(null);
    try {
      const asset = await uploadImageFile(file, 'collections');
      setImageUrl(asset.url);
      setImageAlt(asset.altText || title);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Image upload failed';
      setFormError(msg);
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !handle.trim()) {
      setFormError('Title and handle are required.');
      return;
    }
    if (!isValidHandle(handle.trim())) {
      setFormError('Handle may only use lowercase letters, numbers and single hyphens (e.g. diy-kits).');
      return;
    }

    setFormLoading(true);
    setFormError(null);

    const imageObj: ImageAsset | null = imageUrl.trim()
      ? { url: imageUrl.trim(), altText: imageAlt.trim() || title.trim() }
      : null;

    const input = {
      title: title.trim(),
      handle: handle.trim(),
      description: description.trim(),
      image: imageObj,
      sort_order: sortOrder,
      published,
    };

    try {
      if (editingCollection) {
        if (input.handle !== editingCollection.handle) {
          const inUse = await countProductsInCollection(editingCollection.handle);
          if (inUse > 0) {
            throw new Error(
              `${inUse} product${inUse === 1 ? '' : 's'} use this collection, so its handle can't change.`
            );
          }
        }
        await updateCollection(editingCollection.id, input);
        const oldImage = editingCollection.image?.url;
        if (oldImage && oldImage !== input.image?.url) await deleteImageByUrl(oldImage);
        setSuccessMsg('Collection updated successfully.');
      } else {
        await createCollection(input);
        setSuccessMsg('Collection created successfully.');
      }

      setModalOpen(false);
      fetchCollections();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed.';
      setFormError(msg);
    } finally {
      setFormLoading(false);
    }
  };

  const togglePublish = async (col: Collection) => {
    setError(null);
    try {
      const nextState = !col.published;
      await setCollectionPublished(col.id, nextState);
      setCollections((prev) =>
        prev.map((c) => (c.id === col.id ? { ...c, published: nextState } : c))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update published state.');
    }
  };

  const handleDelete = async (col: Collection) => {
    if (!confirm(`Are you sure you want to delete collection "${col.title}"?`)) return;

    setError(null);
    try {
      const inUse = await countProductsInCollection(col.handle);
      if (inUse > 0) {
        setError(
          `"${col.title}" is used by ${inUse} product${inUse === 1 ? '' : 's'}. Remove it from them before deleting.`
        );
        return;
      }
      await deleteCollection(col.id);
      setCollections((prev) => prev.filter((c) => c.id !== col.id));
      setSuccessMsg(`Collection "${col.title}" deleted.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed.';
      setError(`Error deleting collection: ${msg}`);
    }
  };

  const filtered = collections.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.handle.toLowerCase().includes(search.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold font-serif text-stone-900">Collections</h1>
          <p className="text-sm text-stone-500 mt-1">
            Organize products into categories for the storefront navigation.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center space-x-2 bg-[#380b0c] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#4d1012] transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Collection</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-4 bg-white p-3 rounded-xl border border-stone-200 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search collections by title or handle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg focus:outline-none placeholder-stone-400"
          />
        </div>
        <span className="text-xs text-stone-400 pr-2">
          {filtered.length} collection{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Collections List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 text-stone-500">
          <Loader2 className="w-7 h-7 animate-spin text-[#380b0c] mb-2" />
          <span className="text-sm">Loading collections...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
          <Layers className="w-10 h-10 text-stone-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-stone-800">No collections found</h3>
          <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">
            {search ? 'Try adjusting your search criteria.' : 'Create your first product category.'}
          </p>
          {!search && (
            <button
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center space-x-2 text-xs font-semibold text-[#380b0c] bg-stone-100 hover:bg-stone-200 px-3.5 py-2 rounded-lg transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Collection</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((col) => (
            <div
              key={col.id}
              className="bg-white rounded-xl border border-stone-200/90 shadow-2xs flex flex-col overflow-hidden hover:border-stone-300 transition-colors"
            >
              {/* Image banner or fallback */}
              <div className="h-36 bg-stone-100 relative overflow-hidden flex items-center justify-center border-b border-stone-100">
                {col.image?.url ? (
                  <img
                    src={col.image.url}
                    alt={col.image.altText || col.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center text-stone-400">
                    <Layers className="w-8 h-8 mb-1" />
                    <span className="text-xs">No banner image</span>
                  </div>
                )}
                {/* Published status badge */}
                <div className="absolute top-2.5 right-2.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium backdrop-blur-md ${
                      col.published
                        ? 'bg-emerald-500/90 text-white'
                        : 'bg-stone-800/80 text-stone-200'
                    }`}
                  >
                    {col.published ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-baseline justify-between mb-1">
                    <h3 className="font-semibold text-stone-900 text-base">{col.title}</h3>
                    <span className="text-[11px] font-mono text-stone-400">#{col.sort_order}</span>
                  </div>
                  <p className="text-xs font-mono text-stone-500 mb-2">/{col.handle}</p>
                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                    {col.description || 'No description provided.'}
                  </p>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <button
                    onClick={() => togglePublish(col)}
                    className="text-xs font-medium text-stone-600 hover:text-stone-900"
                  >
                    {col.published ? 'Unpublish' : 'Publish'}
                  </button>

                  <div className="flex items-center space-x-1">
                    <a
                      href={`/hilo/collections/${col.handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View on Storefront (collections added since the last storefront build won't load until it is rebuilt)"
                      className="p-1.5 text-stone-400 hover:text-stone-700 rounded-md hover:bg-stone-100"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => openEditModal(col)}
                      className="p-1.5 text-stone-400 hover:text-stone-700 rounded-md hover:bg-stone-100"
                      title="Edit Collection"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(col)}
                      className="p-1.5 text-rose-400 hover:text-rose-700 rounded-md hover:bg-rose-50"
                      title="Delete Collection"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-stone-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
              <h2 className="text-lg font-bold font-serif text-stone-900">
                {editingCollection ? 'Edit Collection' : 'Create New Collection'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                  Collection Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. DIY Embroidery Kits"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#380b0c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                  URL Handle (Slug) *
                </label>
                <div className="flex rounded-lg border border-stone-300 overflow-hidden text-sm focus-within:ring-2 focus-within:ring-[#380b0c]">
                  <span className="bg-stone-100 px-3 py-2 text-stone-500 font-mono text-xs border-r border-stone-300">
                    /collections/
                  </span>
                  <input
                    type="text"
                    required
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    disabled={handleLockedBy > 0}
                    pattern="[a-z0-9]+(-[a-z0-9]+)*"
                    title="Lowercase letters, numbers and single hyphens"
                    placeholder="diy-kits"
                    className="flex-1 px-3 py-2 focus:outline-none font-mono text-xs"
                  />
                </div>
                {handleLockedBy > 0 && (
                  <p className="text-[11px] text-stone-500 mt-1">
                    Locked: {handleLockedBy} product{handleLockedBy === 1 ? '' : 's'} use this handle.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Introductory text for this collection..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#380b0c]"
                />
              </div>

              {/* Banner Image */}
              <div>
                <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                  Banner Image
                </label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Image URL or upload below..."
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-stone-300 rounded-lg text-xs focus:outline-none"
                    />
                    <label className="inline-flex items-center space-x-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition">
                      {uploadingImage ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {imageUrl && (
                    <div className="h-20 w-36 rounded-lg overflow-hidden border border-stone-200 bg-stone-100 relative">
                      <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setImageUrl('');
                          setImageAlt('');
                        }}
                        className="absolute top-1 right-1 bg-black/60 hover:bg-black text-white p-0.5 rounded-full"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-stone-700 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#380b0c]"
                  />
                </div>

                <div className="flex flex-col justify-end pb-2">
                  <label className="inline-flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={published}
                      onChange={(e) => setPublished(e.target.checked)}
                      className="rounded text-[#380b0c] focus:ring-[#380b0c] w-4 h-4"
                    />
                    <span className="text-sm font-medium text-stone-800">Published to Store</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="inline-flex items-center space-x-2 px-5 py-2 bg-[#380b0c] hover:bg-[#4d1012] text-white rounded-lg text-sm font-medium transition disabled:opacity-60"
                >
                  {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingCollection ? 'Save Changes' : 'Create Collection'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
