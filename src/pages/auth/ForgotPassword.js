import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Alert from '../../components/Alert';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { error } = await resetPassword(email);
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-canvas px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="font-heading text-2xl text-primary">Angie&apos;s Crown</Link>
          <h1 className="font-heading text-3xl text-ink mt-4">Reset your password</h1>
          <p className="font-body text-sm text-muted mt-1">We&apos;ll email you a link to set a new one.</p>
        </div>

        {sent ? (
          <div className="bg-surface border border-line rounded-md p-8 text-center">
            <p className="font-body text-sm text-ink">
              If an account exists for <span className="font-semibold">{email}</span>, a reset link is on its way.
            </p>
            <Link to="/login" className="inline-block mt-6 font-body text-sm font-semibold text-primary hover:text-primary-dark">
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-surface border border-line rounded-md p-8 flex flex-col gap-4">
            <Alert type="error">{error}</Alert>
            <div>
              <label className="block font-body text-sm text-ink mb-1.5" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-line rounded-sm px-3.5 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 font-body font-semibold bg-primary text-white py-3 rounded-sm hover:bg-primary-dark transition-colors disabled:opacity-60"
            >
              {submitting ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p className="text-center font-body text-sm text-muted mt-6">
          <Link to="/login" className="text-primary font-semibold hover:text-primary-dark">← Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}
