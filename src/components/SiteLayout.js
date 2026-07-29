import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

export default function SiteLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
