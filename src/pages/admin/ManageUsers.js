import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import AdminLayout from '../../components/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Alert from '../../components/Alert';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const load = async () => {
    setLoading(true);
    const [userRes, roleRes] = await Promise.all([
      supabase.from('profiles').select('*, roles(id, name)').order('created_at', { ascending: false }),
      supabase.from('roles').select('*').order('name'),
    ]);
    setUsers(userRes.data || []);
    setRoles(roleRes.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return users;
    return users.filter(
      (u) => u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    );
  }, [users, search]);

  const changeRole = async (userId, roleId) => {
    setUpdatingId(userId);
    const { error } = await supabase.from('profiles').update({ role_id: roleId || null }).eq('id', userId);
    setUpdatingId(null);
    if (error) { setError(error.message); return; }
    load();
  };

  const toggleActive = async (u) => {
    setUpdatingId(u.id);
    const { error } = await supabase.from('profiles').update({ is_active: !u.is_active }).eq('id', u.id);
    setUpdatingId(null);
    if (error) { setError(error.message); return; }
    load();
  };

  return (
    <AdminLayout title="Users" description="Manage customer accounts and staff roles.">
      <Alert type="error">{error}</Alert>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or email…"
        className="w-full max-w-sm border border-line rounded-sm px-3.5 py-2.5 font-body text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-primary/40"
      />

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState title="No users found" />
      ) : (
        <div className="bg-surface border border-line rounded-md overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-canvas border-b border-line">
              <tr>
                {['Name', 'Email', 'Phone', 'Role', 'Loyalty', 'Status', ''].map((h) => (
                  <th key={h} className="font-body text-xs uppercase tracking-wide text-muted px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-body text-sm text-ink font-medium">{u.full_name || '—'}</td>
                  <td className="px-4 py-3 font-body text-sm text-muted">{u.email}</td>
                  <td className="px-4 py-3 font-body text-sm text-muted">{u.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role_id || ''}
                      disabled={updatingId === u.id}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                      className="border border-line rounded-sm px-2 py-1.5 font-body text-sm"
                    >
                      <option value="">No role</option>
                      {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-ink">{u.loyalty_points}</td>
                  <td className="px-4 py-3">
                    <span className={`font-body text-xs px-2 py-0.5 rounded-full ${u.is_active ? 'bg-success/10 text-success' : 'bg-muted/10 text-muted'}`}>
                      {u.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      disabled={updatingId === u.id}
                      onClick={() => toggleActive(u)}
                      className="font-body text-xs font-semibold text-primary hover:text-primary-dark disabled:opacity-50"
                    >
                      {u.is_active ? 'Disable' : 'Enable'}
                    </button>
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
