import React from 'react';
import { Link, NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/bookings', label: 'Bookings' },
  { to: '/admin/services', label: 'Services' },
  { to: '/admin/stylists', label: 'Stylists' },
  { to: '/admin/gallery', label: 'Work Gallery' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/revenue', label: 'Revenue' },
];

export default function AdminLayout({ title, description, actions, children }) {
  const linkClass = ({ isActive }) =>
    `block px-4 py-2.5 rounded-sm font-body text-sm transition-colors ${
      isActive ? 'bg-primary text-white' : 'text-ink/70 hover:bg-accent hover:text-primary'
    }`;

  return (
    <div className="min-h-screen bg-canvas flex">
      <aside className="hidden md:flex md:flex-col w-64 shrink-0 bg-surface border-r border-line py-8 px-4">
        <Link to="/" className="font-heading text-xl text-primary px-4 mb-8 block">
          Angie&apos;s Crown
        </Link>
        <nav className="flex flex-col gap-1">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto px-4 pt-8">
          <Link to="/" className="font-body text-xs text-muted hover:text-primary">← Back to site</Link>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="font-heading text-3xl text-ink">{title}</h1>
              {description && <p className="font-body text-sm text-muted mt-1">{description}</p>}
            </div>
            {actions && <div className="flex gap-3">{actions}</div>}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
