import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Alert from '../../components/Alert';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { error } = await signIn({ email, password });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-canvas px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="font-heading text-2xl text-primary">Angie&apos;s Crown</Link>
          <h1 className="font-heading text-3xl text-ink mt-4">Welcome back</h1>
          <p className="font-body text-sm text-muted mt-1">Sign in to manage your appointments.</p>
        </div>

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

          <div className="relative">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block font-body text-sm text-ink" htmlFor="password">Password</label>
              <Link to="/forgot-password" className="font-body text-xs text-primary hover:text-primary-dark">Forgot?</Link>
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-line rounded-sm px-3.5 py-2.5 pr-11 font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="••••••••"
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
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center font-body text-sm text-muted mt-6">
          New here?{' '}
          <Link to="/register" className="text-primary font-semibold hover:text-primary-dark">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
