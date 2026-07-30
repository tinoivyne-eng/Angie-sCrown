import React, { useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import AdminLayout from '../../components/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { addDays, toDateString } from '../../lib/time';

const RANGE_OPTIONS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
];

export default function Revenue() {
  const [rangeDays, setRangeDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    if (!isSupabaseConfigured) {
      setLoading(false);
      return () => { mounted = false; };
    }
    const startDate = toDateString(addDays(new Date(), -rangeDays));
    supabase
      .from('appointments')
      .select('appointment_date, total_price, status, services(name, category_id, categories(name)), stylists(full_name)')
      .gte('appointment_date', startDate)
      .in('status', ['completed', 'confirmed'])
      .then(({ data }) => {
        if (!mounted) return;
        setAppointments(data || []);
        setLoading(false);
      });
    return () => { mounted = false; };
  }, [rangeDays]);

  const totals = useMemo(() => {
    const total = appointments.reduce((sum, a) => sum + Number(a.total_price), 0);
    const byCategory = {};
    const byStylist = {};
    appointments.forEach((a) => {
      const catName = a.services?.categories?.name || 'Other';
      byCategory[catName] = (byCategory[catName] || 0) + Number(a.total_price);
      const stylistName = a.stylists?.full_name || 'Unassigned';
      byStylist[stylistName] = (byStylist[stylistName] || 0) + Number(a.total_price);
    });
    return {
      total,
      count: appointments.length,
      avg: appointments.length ? total / appointments.length : 0,
      byCategory: Object.entries(byCategory).sort((a, b) => b[1] - a[1]),
      byStylist: Object.entries(byStylist).sort((a, b) => b[1] - a[1]),
    };
  }, [appointments]);

  const maxCategory = totals.byCategory[0]?.[1] || 1;
  const maxStylist = totals.byStylist[0]?.[1] || 1;

  return (
    <AdminLayout title="Revenue" description="Track earnings from confirmed and completed bookings.">
      <div className="flex flex-wrap gap-2 mb-8">
        {RANGE_OPTIONS.map((r) => (
          <button
            key={r.days}
            onClick={() => setRangeDays(r.days)}
            className={`font-body text-sm px-4 py-1.5 rounded-full border transition-colors ${
              rangeDays === r.days ? 'bg-primary text-white border-primary' : 'border-line text-ink/70 hover:border-primary'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : appointments.length === 0 ? (
        <EmptyState title="No revenue in this range" description="Try a longer date range." />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
            <div className="bg-surface border border-line rounded-md p-6">
              <p className="font-body text-xs uppercase tracking-wide text-muted mb-2">Total Revenue</p>
              <p className="font-heading text-3xl text-ink">${totals.total.toFixed(2)}</p>
            </div>
            <div className="bg-surface border border-line rounded-md p-6">
              <p className="font-body text-xs uppercase tracking-wide text-muted mb-2">Bookings</p>
              <p className="font-heading text-3xl text-ink">{totals.count}</p>
            </div>
            <div className="bg-surface border border-line rounded-md p-6">
              <p className="font-body text-xs uppercase tracking-wide text-muted mb-2">Average Ticket</p>
              <p className="font-heading text-3xl text-ink">${totals.avg.toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="font-heading text-xl text-ink mb-4">By Category</h2>
              <div className="flex flex-col gap-3">
                {totals.byCategory.map(([name, amount]) => (
                  <div key={name}>
                    <div className="flex justify-between font-body text-sm mb-1">
                      <span className="text-ink">{name}</span>
                      <span className="text-muted">${amount.toFixed(0)}</span>
                    </div>
                    <div className="h-2 bg-line rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(amount / maxCategory) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-heading text-xl text-ink mb-4">By Stylist</h2>
              <div className="flex flex-col gap-3">
                {totals.byStylist.map(([name, amount]) => (
                  <div key={name}>
                    <div className="flex justify-between font-body text-sm mb-1">
                      <span className="text-ink">{name}</span>
                      <span className="text-muted">${amount.toFixed(0)}</span>
                    </div>
                    <div className="h-2 bg-line rounded-full overflow-hidden">
                      <div className="h-full bg-primary-light rounded-full" style={{ width: `${(amount / maxStylist) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
