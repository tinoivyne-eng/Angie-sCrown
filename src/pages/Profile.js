import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';

export default function Profile() {
  const { profile, refreshProfile, loading: authLoading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone })
      .eq('id', profile.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    await refreshProfile();
    setSuccess('Profile updated.');
  };

  if (authLoading || !profile) return <LoadingSpinner fullScreen />;

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="mb-10">
        <p className="font-body text-xs uppercase tracking-wide text-primary font-semibold mb-2">Account</p>
        <h1 className="font-heading text-4xl text-ink">My Profile</h1>
      </div>

      <div className="bg-surface border border-line rounded-md p-8 mb-6 flex items-center gap-6">
        <div className="h-16 w-16 rounded-full bg-accent text-primary font-heading text-2xl flex items-center justify-center">
          {(profile.full_name || profile.email || '?').charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-body text-sm text-muted">Loyalty points</p>
          <p className="font-heading text-2xl text-primary">{profile.loyalty_points}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-surface border border-line rounded-md p-8 flex flex-col gap-4">
        <Alert type="error">{error}</Alert>
        <Alert type="success">{success}</Alert>

        <div>
          <label className="block font-body text-sm text-ink mb-1.5" htmlFor="fullName">Full name</label>
          <input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border border-line rounded-sm px-3.5 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div>
          <label className="block font-body text-sm text-ink mb-1.5" htmlFor="email">Email</label>
          <input
            id="email"
            value={profile.email || ''}
            disabled
            className="w-full border border-line rounded-sm px-3.5 py-2.5 font-body text-sm bg-canvas text-muted"
          />
        </div>

        <div>
          <label className="block font-body text-sm text-ink mb-1.5" htmlFor="phone">Phone</label>
          <input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 555-5555"
            className="w-full border border-line rounded-sm px-3.5 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-2 self-start font-body font-semibold bg-primary text-white px-6 py-2.5 rounded-sm hover:bg-primary-dark transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
