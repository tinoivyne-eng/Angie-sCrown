import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/services', label: 'Services' },
  { to: '/stylists', label: 'Stylists' },
  { to: '/gallery', label: 'Gallery' },
];

export default function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    setMenuOpen(false);
    navigate('/');
  };

  const linkClass = ({ isActive }) =>
    `font-body text-sm tracking-wide transition-colors ${
      isActive ? 'text-primary font-semibold' : 'text-ink/80 hover:text-primary'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur border-b border-line">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="font-heading text-2xl text-primary tracking-tight">
          Angie&apos;s Crown
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass} end={link.to === '/'}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link
            to="/booking"
            className="font-body text-sm font-semibold bg-primary text-white px-5 py-2.5 rounded-sm hover:bg-primary-dark transition-colors shadow-soft"
          >
            Book Now
          </Link>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="h-10 w-10 rounded-full bg-accent text-primary font-heading flex items-center justify-center border border-primary/20"
              >
                {(profile?.full_name || user.email || '?').charAt(0).toUpperCase()}
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-surface border border-line rounded-md shadow-medium py-1">
                  <Link to="/profile" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm font-body text-ink hover:bg-canvas">Profile</Link>
                  <Link to="/appointments" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm font-body text-ink hover:bg-canvas">My Appointments</Link>
                  <Link to="/notifications" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm font-body text-ink hover:bg-canvas">Notifications</Link>
                  <Link to="/settings" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm font-body text-ink hover:bg-canvas">Settings</Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm font-body text-primary font-medium hover:bg-canvas">Admin Dashboard</Link>
                  )}
                  <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm font-body text-danger hover:bg-canvas border-t border-line mt-1">
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="font-body text-sm text-ink/80 hover:text-primary">
              Sign In
            </Link>
          )}
        </div>

        <button
          className="md:hidden text-ink"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileOpen ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-line bg-surface px-6 py-4 flex flex-col gap-3">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass} onClick={() => setMobileOpen(false)} end={link.to === '/'}>
              {link.label}
            </NavLink>
          ))}
          <Link to="/booking" onClick={() => setMobileOpen(false)} className="font-body text-sm font-semibold bg-primary text-white px-5 py-2.5 rounded-sm text-center">
            Book Now
          </Link>
          {user ? (
            <>
              <Link to="/profile" onClick={() => setMobileOpen(false)} className="font-body text-sm text-ink/80">Profile</Link>
              <Link to="/appointments" onClick={() => setMobileOpen(false)} className="font-body text-sm text-ink/80">My Appointments</Link>
              {isAdmin && <Link to="/admin" onClick={() => setMobileOpen(false)} className="font-body text-sm text-primary font-medium">Admin Dashboard</Link>}
              <button onClick={handleSignOut} className="font-body text-sm text-danger text-left">Sign Out</button>
            </>
          ) : (
            <Link to="/login" onClick={() => setMobileOpen(false)} className="font-body text-sm text-ink/80">Sign In</Link>
          )}
        </div>
      )}
    </header>
  );
}
