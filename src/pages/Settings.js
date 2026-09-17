import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';

export default function Settings() {
  const { signOut } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSuccess('Password updated.');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="mb-10">
        <p className="font-body text-xs uppercase tracking-wide text-primary font-semibold mb-2">Account</p>
        <h1 className="font-heading text-4xl text-ink">Settings</h1>
      </div>

      <div className="bg-surface border border-line rounded-md p-8 mb-6">
        <h2 className="font-heading text-xl text-ink mb-4">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
          <Alert type="error">{error}</Alert>
          <Alert type="success">{success}</Alert>
          <div>
            <label className="block font-body text-sm text-ink mb-1.5" htmlFor="newPassword">New password</label>
            <div className="relative">
              <input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-line rounded-sm px-3.5 py-2.5 pr-11 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((visible) => !visible)}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted hover:text-primary focus:outline-none focus:text-primary"
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showNewPassword}
              >
                {showNewPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block font-body text-sm text-ink mb-1.5" htmlFor="confirmPassword">Confirm new password</label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-line rounded-sm px-3.5 py-2.5 pr-11 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((visible) => !visible)}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted hover:text-primary focus:outline-none focus:text-primary"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showConfirmPassword}
              >
                {showConfirmPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="self-start font-body font-semibold bg-primary text-white px-6 py-2.5 rounded-sm hover:bg-primary-dark transition-colors disabled:opacity-60"
          >
            {saving ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>

      <div className="bg-surface border border-line rounded-md p-8">
        <h2 className="font-heading text-xl text-ink mb-2">Sign out everywhere</h2>
        <p className="font-body text-sm text-muted mb-4">This will end your session on this device.</p>
        <button
          onClick={signOut}
          className="font-body font-semibold border border-danger text-danger px-6 py-2.5 rounded-sm hover:bg-danger/5 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
