import React, { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import AdminLayout from '../../components/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import Alert from '../../components/Alert';

function slugify(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const emptyService = { id: null, category_id: '', name: '', description: '', price: '', duration_minutes: '', is_active: true };
const emptyCategory = { id: null, name: '', description: '' };

export default function ManageServices() {
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [serviceModal, setServiceModal] = useState(null);
  const [categoryModal, setCategoryModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    const [catRes, svcRes] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('services').select('*, categories(name)').order('name'),
    ]);
    setCategories(catRes.data || []);
    setServices(svcRes.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const saveService = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = {
      category_id: serviceModal.category_id || null,
      name: serviceModal.name,
      slug: slugify(serviceModal.name),
      description: serviceModal.description || null,
      price: Number(serviceModal.price),
      duration_minutes: Number(serviceModal.duration_minutes),
      is_active: serviceModal.is_active,
    };
    const query = serviceModal.id
      ? supabase.from('services').update(payload).eq('id', serviceModal.id)
      : supabase.from('services').insert(payload);
    const { error } = await query;
    setSaving(false);
    if (error) { setError(error.message); return; }
    setServiceModal(null);
    load();
  };

  const deleteService = async (id) => {
    if (!window.confirm('Delete this service? This cannot be undone.')) return;
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) { setError(error.message); return; }
    load();
  };

  const saveCategory = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = {
      name: categoryModal.name,
      slug: slugify(categoryModal.name),
      description: categoryModal.description || null,
    };
    const query = categoryModal.id
      ? supabase.from('categories').update(payload).eq('id', categoryModal.id)
      : supabase.from('categories').insert(payload);
    const { error } = await query;
    setSaving(false);
    if (error) { setError(error.message); return; }
    setCategoryModal(null);
    load();
  };

  const deleteCategory = async (id) => {
    if (!window.confirm('Delete this category? Services in it will be uncategorized.')) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) { setError(error.message); return; }
    load();
  };

  return (
    <AdminLayout
      title="Services"
      description="Manage categories and the services customers can book."
      actions={
        <>
          <button onClick={() => setCategoryModal(emptyCategory)} className="font-body text-sm font-semibold border border-primary text-primary px-4 py-2 rounded-sm hover:bg-primary/5">
            + Category
          </button>
          <button onClick={() => setServiceModal(emptyService)} className="font-body text-sm font-semibold bg-primary text-white px-4 py-2 rounded-sm hover:bg-primary-dark">
            + Service
          </button>
        </>
      }
    >
      <Alert type="error">{error}</Alert>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center gap-2 bg-accent/50 border border-primary/20 rounded-full pl-4 pr-2 py-1.5">
                <span className="font-body text-sm text-ink">{c.name}</span>
                <button onClick={() => setCategoryModal(c)} className="text-primary text-xs hover:underline">Edit</button>
                <button onClick={() => deleteCategory(c.id)} className="text-danger text-xs hover:underline">Delete</button>
              </div>
            ))}
            {categories.length === 0 && <p className="font-body text-sm text-muted">No categories yet.</p>}
          </div>

          {services.length === 0 ? (
            <EmptyState title="No services yet" description="Add your first service to get started." />
          ) : (
            <div className="bg-surface border border-line rounded-md overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-canvas border-b border-line">
                  <tr>
                    {['Name', 'Category', 'Price', 'Duration', 'Status', ''].map((h) => (
                      <th key={h} className="font-body text-xs uppercase tracking-wide text-muted px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {services.map((s) => (
                    <tr key={s.id}>
                      <td className="px-4 py-3 font-body text-sm text-ink font-medium">{s.name}</td>
                      <td className="px-4 py-3 font-body text-sm text-muted">{s.categories?.name || '—'}</td>
                      <td className="px-4 py-3 font-body text-sm text-ink">${Number(s.price).toFixed(2)}</td>
                      <td className="px-4 py-3 font-body text-sm text-ink">{s.duration_minutes} min</td>
                      <td className="px-4 py-3">
                        <span className={`font-body text-xs px-2 py-0.5 rounded-full ${s.is_active ? 'bg-success/10 text-success' : 'bg-muted/10 text-muted'}`}>
                          {s.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                          <button onClick={() => setServiceModal({ ...s, category_id: s.category_id || '' })} className="font-body text-xs font-semibold text-primary hover:text-primary-dark">Edit</button>
                          <button onClick={() => deleteService(s.id)} className="font-body text-xs font-semibold text-danger hover:text-danger/80">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {serviceModal && (
        <Modal title={serviceModal.id ? 'Edit Service' : 'New Service'} onClose={() => setServiceModal(null)}>
          <form onSubmit={saveService} className="flex flex-col gap-4">
            <div>
              <label className="block font-body text-sm text-ink mb-1.5">Name</label>
              <input required value={serviceModal.name} onChange={(e) => setServiceModal({ ...serviceModal, name: e.target.value })}
                className="w-full border border-line rounded-sm px-3.5 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="block font-body text-sm text-ink mb-1.5">Category</label>
              <select value={serviceModal.category_id} onChange={(e) => setServiceModal({ ...serviceModal, category_id: e.target.value })}
                className="w-full border border-line rounded-sm px-3.5 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option value="">Uncategorized</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-body text-sm text-ink mb-1.5">Description</label>
              <textarea rows={2} value={serviceModal.description || ''} onChange={(e) => setServiceModal({ ...serviceModal, description: e.target.value })}
                className="w-full border border-line rounded-sm px-3.5 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-body text-sm text-ink mb-1.5">Price ($)</label>
                <input required type="number" min="0" step="0.01" value={serviceModal.price} onChange={(e) => setServiceModal({ ...serviceModal, price: e.target.value })}
                  className="w-full border border-line rounded-sm px-3.5 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div>
                <label className="block font-body text-sm text-ink mb-1.5">Duration (min)</label>
                <input required type="number" min="1" value={serviceModal.duration_minutes} onChange={(e) => setServiceModal({ ...serviceModal, duration_minutes: e.target.value })}
                  className="w-full border border-line rounded-sm px-3.5 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
            </div>
            <label className="flex items-center gap-2 font-body text-sm text-ink">
              <input type="checkbox" checked={serviceModal.is_active} onChange={(e) => setServiceModal({ ...serviceModal, is_active: e.target.checked })} />
              Active (visible to customers)
            </label>
            <button type="submit" disabled={saving} className="mt-2 font-body font-semibold bg-primary text-white py-2.5 rounded-sm hover:bg-primary-dark disabled:opacity-60">
              {saving ? 'Saving…' : 'Save Service'}
            </button>
          </form>
        </Modal>
      )}

      {categoryModal && (
        <Modal title={categoryModal.id ? 'Edit Category' : 'New Category'} onClose={() => setCategoryModal(null)}>
          <form onSubmit={saveCategory} className="flex flex-col gap-4">
            <div>
              <label className="block font-body text-sm text-ink mb-1.5">Name</label>
              <input required value={categoryModal.name} onChange={(e) => setCategoryModal({ ...categoryModal, name: e.target.value })}
                className="w-full border border-line rounded-sm px-3.5 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="block font-body text-sm text-ink mb-1.5">Description</label>
              <textarea rows={2} value={categoryModal.description || ''} onChange={(e) => setCategoryModal({ ...categoryModal, description: e.target.value })}
                className="w-full border border-line rounded-sm px-3.5 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <button type="submit" disabled={saving} className="mt-2 font-body font-semibold bg-primary text-white py-2.5 rounded-sm hover:bg-primary-dark disabled:opacity-60">
              {saving ? 'Saving…' : 'Save Category'}
            </button>
          </form>
        </Modal>
      )}
    </AdminLayout>
  );
}
