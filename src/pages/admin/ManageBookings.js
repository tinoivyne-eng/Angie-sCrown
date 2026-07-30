import React, { useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import AdminLayout from '../../components/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import { formatDateLabel, formatTimeLabel } from '../../lib/time';

const STATUS_FILTERS = ['all', 'pending', 'confirmed', 'completed', 'cancelled', 'no_show'];
const NEXT_ACTIONS = {
  pending: [['confirmed', 'Confirm'], ['cancelled', 'Decline']],
  confirmed: [['completed', 'Mark Completed'], ['no_show', 'Mark No-show'], ['cancelled', 'Cancel']],
  completed: [],
  cancelled: [],
  no_show: [],
};

export default function ManageBookings() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  const load = async () => {
    setLoading(true);
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('appointments')
      .select('*, services(name), stylists(full_name), profiles(full_name, email, phone)')
      .order('appointment_date', { ascending: false })
      .order('start_time', { ascending: false });
    setAppointments(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => (filter === 'all' ? appointments : appointments.filter((a) => a.status === filter)),
    [appointments, filter]
  );

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
    setUpdatingId(null);
    if (error) {
      window.alert(error.message);
      return;
    }
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  };

  return (
    <AdminLayout title="Bookings" description="Confirm, complete, or cancel appointments.">
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`font-body text-sm px-4 py-1.5 rounded-full border capitalize transition-colors ${
              filter === s ? 'bg-primary text-white border-primary' : 'border-line text-ink/70 hover:border-primary'
            }`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState title="No bookings match this filter" />
      ) : (
        <div className="bg-surface border border-line rounded-md overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-canvas border-b border-line">
              <tr>
                {['Customer', 'Service', 'Stylist', 'When', 'Price', 'Status', ''].map((h) => (
                  <th key={h} className="font-body text-xs uppercase tracking-wide text-muted px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3 font-body text-sm text-ink">
                    <div>{a.profiles?.full_name || '—'}</div>
                    <div className="text-xs text-muted">{a.profiles?.email}</div>
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-ink">{a.services?.name}</td>
                  <td className="px-4 py-3 font-body text-sm text-ink">{a.stylists?.full_name}</td>
                  <td className="px-4 py-3 font-body text-sm text-ink whitespace-nowrap">
                    {formatDateLabel(a.appointment_date)} · {formatTimeLabel(a.start_time)}
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-ink">${Number(a.total_price).toFixed(0)}</td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {(NEXT_ACTIONS[a.status] || []).map(([next, label]) => (
                        <button
                          key={next}
                          disabled={updatingId === a.id}
                          onClick={() => updateStatus(a.id, next)}
                          className="font-body text-xs font-semibold text-primary hover:text-primary-dark disabled:opacity-50"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
