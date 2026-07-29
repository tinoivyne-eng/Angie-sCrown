import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import AdminLayout from '../../components/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import Alert from '../../components/Alert';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const emptyStylist = {
  id: null,
  full_name: '',
  bio: '',
  specialties: '',
  years_experience: '',
  is_active: true,
};

export default function ManageStylists() {
  const [stylists, setStylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stylistModal, setStylistModal] = useState(null);
  const [hoursModal, setHoursModal] = useState(null);
  const [hours, setHours] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('stylists').select('*').order('full_name');
    setStylists(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const saveStylist = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = {
      full_name: stylistModal.full_name,
      bio: stylistModal.bio || null,
      specialties: stylistModal.specialties
        ? stylistModal.specialties.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      years_experience: stylistModal.years_experience ? Number(stylistModal.years_experience) : null,
      is_active: stylistModal.is_active,
    };
    const query = stylistModal.id
      ? supabase.from('stylists').update(payload).eq('id', stylistModal.id)
      : supabase.from('stylists').insert(payload);
    const { error } = await query;
    setSaving(false);
    if (error) { setError(error.message); return; }
    setStylistModal(null);
    load();
  };

  const deleteStylist = async (id) => {
    if (!window.confirm('Remove this stylist? Existing appointments will be kept.')) return;
    const { error } = await supabase.from('stylists').delete().eq('id', id);
    if (error) { setError(error.message); return; }
    load();
  };

  const openHours = async (stylist) => {
    setHoursModal(stylist);
    const { data } = await supabase.from('working_hours').select('*').eq('stylist_id', stylist.id);
    const byDay = {};
    (data || []).forEach((h) => { byDay[h.day_of_week] = h; });
    setHours(
      DAYS.map((_, i) => byDay[i] || {
        day_of_week: i,
        start_time: '09:00:00',
        end_time: '18:00:00',
        is_day_off: i === 0 || i === 1,
      })
    );
  };

  const saveHours = async () => {
    setSaving(true);
    const rows = hours.map((h) => ({
      stylist_id: hoursModal.id,
      day_of_week: h.day_of_week,
      start_time: h.start_time,
      end_time: h.end_time,
      is_day_off: h.is_day_off,
    }));
    const { error } = await supabase.from('working_hours').upsert(rows, { onConflict: 'stylist_id,day_of_week' });
    setSaving(false);
    if (error) { setError(error.message); return; }
    setHoursModal(null);
  };

  return (
    <AdminLayout
      title="Stylists"
      description="Manage your team and their weekly availability."
      actions={
        <button onClick={() => setStylistModal(emptyStylist)} className="font-body text-sm font-semibold bg-primary text-white px-4 py-2 rounded-sm hover:bg-primary-dark">
          + Stylist
        </button>
      }
    >
      <Alert type="error">{error}</Alert>

      {loading ? (
        <LoadingSpinner />
      ) : stylists.length === 0 ? (
        <EmptyState title="No stylists yet" description="Add your first team member." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {stylists.map((s) => (
            <div key={s.id} className="bg-surface border border-line rounded-md p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-heading text-lg text-ink">{s.full_name}</h3>
                <span className={`font-body text-xs px-2 py-0.5 rounded-full shrink-0 ${s.is_active ? 'bg-success/10 text-success' : 'bg-muted/10 text-muted'}`}>
                  {s.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="font-body text-xs text-muted mt-1">
                {s.rating_count > 0 ? `★ ${s.rating_avg.toFixed(1)} (${s.rating_count})` : 'No reviews yet'}
                {s.years_experience ? ` · ${s.years_experience} yrs exp.` : ''}
              </p>
              {s.specialties?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {s.specialties.map((sp) => (
                    <span key={sp} className="font-body text-xs bg-accent text-primary px-2 py-0.5 rounded-full">{sp}</span>
                  ))}
                </div>
              )}
              <div className="flex gap-4 mt-4 pt-3 border-t border-line">
                <button onClick={() => setStylistModal({ ...s, specialties: (s.specialties || []).join(', '), years_experience: s.years_experience || '' })} className="font-body text-xs font-semibold text-primary hover:text-primary-dark">Edit</button>
                <button onClick={() => openHours(s)} className="font-body text-xs font-semibold text-primary hover:text-primary-dark">Hours</button>
                <button onClick={() => deleteStylist(s.id)} className="font-body text-xs font-semibold text-danger hover:text-danger/80">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {stylistModal && (
        <Modal title={stylistModal.id ? 'Edit Stylist' : 'New Stylist'} onClose={() => setStylistModal(null)}>
          <form onSubmit={saveStylist} className="flex flex-col gap-4">
            <div>
              <label className="block font-body text-sm text-ink mb-1.5">Full name</label>
              <input required value={stylistModal.full_name} onChange={(e) => setStylistModal({ ...stylistModal, full_name: e.target.value })}
                className="w-full border border-line rounded-sm px-3.5 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="block font-body text-sm text-ink mb-1.5">Bio</label>
              <textarea rows={3} value={stylistModal.bio || ''} onChange={(e) => setStylistModal({ ...stylistModal, bio: e.target.value })}
                className="w-full border border-line rounded-sm px-3.5 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="block font-body text-sm text-ink mb-1.5">Specialties (comma separated)</label>
              <input value={stylistModal.specialties} onChange={(e) => setStylistModal({ ...stylistModal, specialties: e.target.value })}
                placeholder="Color, Cutting, Balayage"
                className="w-full border border-line rounded-sm px-3.5 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="block font-body text-sm text-ink mb-1.5">Years of experience</label>
              <input type="number" min="0" value={stylistModal.years_experience} onChange={(e) => setStylistModal({ ...stylistModal, years_experience: e.target.value })}
                className="w-full border border-line rounded-sm px-3.5 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <label className="flex items-center gap-2 font-body text-sm text-ink">
              <input type="checkbox" checked={stylistModal.is_active} onChange={(e) => setStylistModal({ ...stylistModal, is_active: e.target.checked })} />
              Active (bookable by customers)
            </label>
            <button type="submit" disabled={saving} className="mt-2 font-body font-semibold bg-primary text-white py-2.5 rounded-sm hover:bg-primary-dark disabled:opacity-60">
              {saving ? 'Saving…' : 'Save Stylist'}
            </button>
          </form>
        </Modal>
      )}

      {hoursModal && (
        <Modal title={`Working Hours — ${hoursModal.full_name}`} onClose={() => setHoursModal(null)} wide>
          <div className="flex flex-col gap-3">
            {hours.map((h, i) => (
              <div key={h.day_of_week} className="flex items-center gap-3">
                <span className="font-body text-sm text-ink w-10">{DAYS[h.day_of_week]}</span>
                <label className="flex items-center gap-1.5 font-body text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={h.is_day_off}
                    onChange={(e) => {
                      const next = [...hours];
                      next[i] = { ...h, is_day_off: e.target.checked };
                      setHours(next);
                    }}
                  />
                  Day off
                </label>
                <input
                  type="time"
                  disabled={h.is_day_off}
                  value={h.start_time?.slice(0, 5)}
                  onChange={(e) => {
                    const next = [...hours];
                    next[i] = { ...h, start_time: `${e.target.value}:00` };
                    setHours(next);
                  }}
                  className="border border-line rounded-sm px-2 py-1.5 font-body text-sm disabled:opacity-40"
                />
                <span className="font-body text-sm text-muted">to</span>
                <input
                  type="time"
                  disabled={h.is_day_off}
                  value={h.end_time?.slice(0, 5)}
                  onChange={(e) => {
                    const next = [...hours];
                    next[i] = { ...h, end_time: `${e.target.value}:00` };
                    setHours(next);
                  }}
                  className="border border-line rounded-sm px-2 py-1.5 font-body text-sm disabled:opacity-40"
                />
              </div>
            ))}
            <button onClick={saveHours} disabled={saving} className="mt-2 font-body font-semibold bg-primary text-white py-2.5 rounded-sm hover:bg-primary-dark disabled:opacity-60">
              {saving ? 'Saving…' : 'Save Hours'}
            </button>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}
