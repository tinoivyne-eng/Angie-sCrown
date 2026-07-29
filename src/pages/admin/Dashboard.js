import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import AdminLayout from '../../components/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import { formatDateLabel, formatTimeLabel, toDateString } from '../../lib/time';

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-surface border border-line rounded-md p-6">
      <p className="font-body text-xs uppercase tracking-wide text-muted mb-2">{label}</p>
      <p className="font-heading text-3xl text-ink">{value}</p>
      {sub && <p className="font-body text-xs text-muted mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayCount: 0,
    pendingCount: 0,
    monthRevenue: 0,
    activeStylists: 0,
  });
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const today = toDateString(new Date());
      const monthStart = toDateString(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

      const [todayRes, pendingRes, stylistRes, monthRes, recentRes] = await Promise.all([
        supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('appointment_date', today),
        supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('stylists').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('appointments').select('total_price, status').gte('appointment_date', monthStart),
        supabase
          .from('appointments')
          .select('*, services(name), stylists(full_name), profiles(full_name, email)')
          .order('created_at', { ascending: false })
          .limit(8),
      ]);

      if (!mounted) return;

      const monthRevenue = (monthRes.data || [])
        .filter((a) => a.status === 'completed' || a.status === 'confirmed')
        .reduce((sum, a) => sum + Number(a.total_price), 0);

      setStats({
        todayCount: todayRes.count || 0,
        pendingCount: pendingRes.count || 0,
        monthRevenue,
        activeStylists: stylistRes.count || 0,
      });
      setRecent(recentRes.data || []);
      setLoading(false);
    }
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <AdminLayout title="Dashboard" description="A snapshot of how the salon is doing.">
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            <StatCard label="Today's Appointments" value={stats.todayCount} />
            <StatCard label="Pending Requests" value={stats.pendingCount} sub="Needs confirmation" />
            <StatCard label="Revenue This Month" value={`$${stats.monthRevenue.toFixed(0)}`} />
            <StatCard label="Active Stylists" value={stats.activeStylists} />
          </div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl text-ink">Recent Bookings</h2>
            <Link to="/admin/bookings" className="font-body text-sm text-primary font-semibold hover:text-primary-dark">
              View all →
            </Link>
          </div>

          {recent.length === 0 ? (
            <EmptyState title="No bookings yet" />
          ) : (
            <div className="bg-surface border border-line rounded-md divide-y divide-line">
              {recent.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-body text-sm text-ink font-medium">{a.profiles?.full_name || a.profiles?.email}</p>
                    <p className="font-body text-xs text-muted">
                      {a.services?.name} with {a.stylists?.full_name} · {formatDateLabel(a.appointment_date)} at {formatTimeLabel(a.start_time)}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
