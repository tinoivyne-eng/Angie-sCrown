import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Alert from '../../components/Alert';

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSubmitting(true);
    const { data, error } = await signUp({ email, password, fullName });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data?.session) {
      navigate('/', { replace: true });
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-canvas px-6 py-16">
        <div className="w-full max-w-md text-center bg-surface border border-line rounded-md p-8">
          <h1 className="font-heading text-2xl text-ink mb-2">Check your inbox</h1>
          <p className="font-body text-sm text-muted">
            We&apos;ve sent a confirmation link to <span className="text-ink">{email}</span>. Confirm your email to finish creating your account.
          </p>
          <Link to="/login" className="inline-block mt-6 font-body text-sm font-semibold text-primary hover:text-primary-dark">
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-canvas px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="font-heading text-2xl text-primary">Angie&apos;s Crown</Link>
          <h1 className="font-heading text-3xl text-ink mt-4">Create your account</h1>
          <p className="font-body text-sm text-muted mt-1">Book faster and track your appointments.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface border border-line rounded-md p-8 flex flex-col gap-4">
          <Alert type="error">{error}</Alert>

          <div>
            <label className="block font-body text-sm text-ink mb-1.5" htmlFor="fullName">Full name</label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-line rounded-sm px-3.5 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Jane Doe"
            />
          </div>

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

          <div className="relative">
            <label className="block font-body text-sm text-ink mb-1.5" htmlFor="password">Password</label>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-line rounded-sm px-3.5 py-2.5 pr-11 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="At least 6 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              className="absolute bottom-0 right-0 flex h-11 w-11 items-center justify-center text-muted hover:text-primary focus:outline-none focus:text-primary"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 font-body font-semibold bg-primary text-white py-3 rounded-sm hover:bg-primary-dark transition-colors disabled:opacity-60"
          >
            {submitting ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center font-body text-sm text-muted mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-semibold hover:text-primary-dark">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
