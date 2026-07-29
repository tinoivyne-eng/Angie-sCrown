import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center px-6 bg-canvas">
      <p className="font-heading text-7xl text-primary/30 mb-4">404</p>
      <h1 className="font-heading text-3xl text-ink mb-3">Page not found</h1>
      <p className="font-body text-muted mb-8 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <Link to="/" className="font-body font-semibold bg-primary text-white px-6 py-3 rounded-sm hover:bg-primary-dark transition-colors">
        Back to Home
      </Link>
    </div>
  );
}
