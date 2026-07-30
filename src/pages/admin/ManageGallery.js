import React, { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import AdminLayout from '../../components/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import Alert from '../../components/Alert';

const emptyWork = {
  id: null,
  title: '',
  description: '',
  image_url: '',
  category: 'hair',
  sort_order: 0,
  is_featured: false,
};

function fileNameFor(file) {
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/(^-|-$)/g, '');
  return `work/${Date.now()}-${safeName}`;
}

export default function ManageGallery() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workModal, setWorkModal] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setError('');
    if (!isSupabaseConfigured) {
      setItems([]);
      setLoading(false);
      setError('Supabase needs to be configured before the owner can update gallery work.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.from('gallery').select('*').order('sort_order').order('created_at', { ascending: false });
    if (error) setError(error.message);
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openModal = (item = emptyWork) => {
    setError('');
    setImageFile(null);
    setWorkModal({ ...item, sort_order: item.sort_order || 0 });
  };

  const saveWork = async (e) => {
    e.preventDefault();
    setError('');

    if (!workModal.image_url && !imageFile) {
      setError('Add an image file or paste an image URL.');
      return;
    }

    setSaving(true);
    let imageUrl = workModal.image_url;

    if (imageFile) {
      const uploadPath = fileNameFor(imageFile);
      const { error: uploadError } = await supabase.storage.from('gallery').upload(uploadPath, imageFile, { upsert: false });
      if (uploadError) {
        setSaving(false);
        setError(uploadError.message);
        return;
      }
      const { data } = supabase.storage.from('gallery').getPublicUrl(uploadPath);
      imageUrl = data.publicUrl;
    }

    const payload = {
      title: workModal.title || null,
      description: workModal.description || null,
      image_url: imageUrl,
      category: workModal.category || null,
      sort_order: Number(workModal.sort_order) || 0,
      is_featured: workModal.is_featured,
    };

    const query = workModal.id
      ? supabase.from('gallery').update(payload).eq('id', workModal.id)
      : supabase.from('gallery').insert(payload);
    const { error } = await query;
    setSaving(false);
    if (error) { setError(error.message); return; }
    setWorkModal(null);
    setImageFile(null);
    load();
  };

  const deleteWork = async (item) => {
    if (!window.confirm('Delete this gallery item?')) return;
    const { error } = await supabase.from('gallery').delete().eq('id', item.id);
    if (error) { setError(error.message); return; }
    load();
  };

  return (
    <AdminLayout
      title="Work Gallery"
      description="Add hairstyles, portfolio photos, and featured salon work."
      actions={
        <button onClick={() => openModal()} className="font-body text-sm font-semibold bg-primary text-white px-4 py-2 rounded-sm hover:bg-primary-dark">
          + Add Work
        </button>
      }
    >
      <Alert type="error">{error}</Alert>

      {loading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <EmptyState title="No work added yet" description="Add finished hairstyles and salon photos for customers to browse." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => (
            <div key={item.id} className="bg-surface border border-line rounded-md overflow-hidden shadow-soft">
              <div className="aspect-[4/5] bg-accent">
                <img src={item.image_url} alt={item.title || 'Salon work'} className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-heading text-lg text-ink">{item.title || 'Untitled work'}</h3>
                    <p className="font-body text-xs text-muted capitalize">{item.category || 'gallery'}</p>
                  </div>
                  {item.is_featured && <span className="font-body text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Featured</span>}
                </div>
                {item.description && <p className="font-body text-sm text-muted mt-3">{item.description}</p>}
                <div className="flex gap-4 mt-4 pt-3 border-t border-line">
                  <button onClick={() => openModal(item)} className="font-body text-xs font-semibold text-primary hover:text-primary-dark">Edit</button>
                  <button onClick={() => deleteWork(item)} className="font-body text-xs font-semibold text-danger hover:text-danger/80">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {workModal && (
        <Modal title={workModal.id ? 'Edit Work' : 'Add Work'} onClose={() => setWorkModal(null)} wide>
          <form onSubmit={saveWork} className="grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr] gap-6">
            <div>
              <div className="aspect-[4/5] rounded-md overflow-hidden bg-accent border border-line">
                {(imageFile || workModal.image_url) ? (
                  <img
                    src={imageFile ? URL.createObjectURL(imageFile) : workModal.image_url}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center px-6 text-center font-body text-sm text-muted">
                    Image preview
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <Alert type="error">{error}</Alert>
              <div>
                <label className="block font-body text-sm text-ink mb-1.5">Image file</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full border border-line rounded-sm px-3.5 py-2.5 font-body text-sm"
                />
              </div>
              <div>
                <label className="block font-body text-sm text-ink mb-1.5">Or image URL</label>
                <input value={workModal.image_url || ''} onChange={(e) => setWorkModal({ ...workModal, image_url: e.target.value })}
                  placeholder="https://example.com/hairstyle.jpg"
                  className="w-full border border-line rounded-sm px-3.5 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div>
                <label className="block font-body text-sm text-ink mb-1.5">Title</label>
                <input value={workModal.title || ''} onChange={(e) => setWorkModal({ ...workModal, title: e.target.value })}
                  placeholder="Silk press with layers"
                  className="w-full border border-line rounded-sm px-3.5 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div>
                <label className="block font-body text-sm text-ink mb-1.5">Category</label>
                <input value={workModal.category || ''} onChange={(e) => setWorkModal({ ...workModal, category: e.target.value })}
                  placeholder="hair, braids, color, bridal"
                  className="w-full border border-line rounded-sm px-3.5 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div>
                <label className="block font-body text-sm text-ink mb-1.5">Description</label>
                <textarea rows={3} value={workModal.description || ''} onChange={(e) => setWorkModal({ ...workModal, description: e.target.value })}
                  className="w-full border border-line rounded-sm px-3.5 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-sm text-ink mb-1.5">Sort order</label>
                  <input type="number" value={workModal.sort_order} onChange={(e) => setWorkModal({ ...workModal, sort_order: e.target.value })}
                    className="w-full border border-line rounded-sm px-3.5 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
                <label className="flex items-end gap-2 pb-3 font-body text-sm text-ink">
                  <input type="checkbox" checked={workModal.is_featured} onChange={(e) => setWorkModal({ ...workModal, is_featured: e.target.checked })} />
                  Featured
                </label>
              </div>
              <button type="submit" disabled={saving} className="font-body font-semibold bg-primary text-white py-2.5 rounded-sm hover:bg-primary-dark disabled:opacity-60">
                {saving ? 'Saving…' : 'Save Work'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AdminLayout>
  );
}
