import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import Alert from '../../components/Alert';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ResetPassword() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    await signOut();
    navigate('/login', { replace: true, state: { passwordReset: true } });
  };

  if (loading) return <LoadingSpinner fullScreen label="Verifying reset link…" />;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas px-6 py-16">
        <div className="w-full max-w-md text-center bg-surface border border-line rounded-md p-8">
          <h1 className="font-heading text-2xl text-ink">This reset link is invalid or has expired</h1>
          <p className="font-body text-sm text-muted mt-3">Request a new password reset link and use it as soon as it arrives.</p>
          <Link to="/forgot-password" className="inline-block mt-6 font-body text-sm font-semibold text-primary hover:text-primary-dark">Request a new link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="font-heading text-2xl text-primary">Angie&apos;s Crown</Link>
          <h1 className="font-heading text-3xl text-ink mt-4">Choose a new password</h1>
          <p className="font-body text-sm text-muted mt-1">Use at least 6 characters.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface border border-line rounded-md p-8 flex flex-col gap-4">
          <Alert type="error">{error}</Alert>
          <div>
            <label className="block font-body text-sm text-ink mb-1.5" htmlFor="password">New password</label>
            <div className="relative">
              <input id="password" type={showPassword ? 'text' : 'password'} required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full border border-line rounded-sm px-3.5 py-2.5 pr-11 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted hover:text-primary focus:outline-none focus:text-primary" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block font-body text-sm text-ink mb-1.5" htmlFor="confirmPassword">Confirm new password</label>
            <div className="relative">
              <input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full border border-line rounded-sm px-3.5 py-2.5 pr-11 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              <button type="button" onClick={() => setShowConfirmPassword((visible) => !visible)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted hover:text-primary focus:outline-none focus:text-primary" aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
                {showConfirmPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={saving} className="mt-2 font-body font-semibold bg-primary text-white py-3 rounded-sm hover:bg-primary-dark transition-colors disabled:opacity-60">
            {saving ? 'Updating password…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
