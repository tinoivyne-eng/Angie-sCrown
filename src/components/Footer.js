import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-secondary text-white/80 mt-24">
      <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <h3 className="font-heading text-2xl text-white mb-2">Angie&apos;s Crown</h3>
          <p className="font-body text-sm text-white/60 leading-relaxed">
            Hair, nails, skin, and makeup — crafted with care in the heart of the city.
          </p>
        </div>
        <div>
          <h4 className="font-body text-sm font-semibold text-white mb-3 tracking-wide uppercase">Explore</h4>
          <ul className="space-y-2 font-body text-sm">
            <li><Link to="/services" className="hover:text-primary-light">Services</Link></li>
            <li><Link to="/stylists" className="hover:text-primary-light">Stylists</Link></li>
            <li><Link to="/gallery" className="hover:text-primary-light">Gallery</Link></li>
            <li><Link to="/booking" className="hover:text-primary-light">Book an Appointment</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-body text-sm font-semibold text-white mb-3 tracking-wide uppercase">Account</h4>
          <ul className="space-y-2 font-body text-sm">
            <li><Link to="/login" className="hover:text-primary-light">Sign In</Link></li>
            <li><Link to="/register" className="hover:text-primary-light">Create Account</Link></li>
            <li><Link to="/appointments" className="hover:text-primary-light">My Appointments</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-body text-sm font-semibold text-white mb-3 tracking-wide uppercase">Visit</h4>
          <ul className="space-y-2 font-body text-sm text-white/60">
            <li>Tue – Sat, 9am – 6pm</li>
            <li>Closed Sun & Mon</li>
            <li>hello@angiescrown.com</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center font-body text-xs text-white/40">
        © {new Date().getFullYear()} Angie&apos;s Crown. All rights reserved.
      </div>
    </footer>
  );
}
