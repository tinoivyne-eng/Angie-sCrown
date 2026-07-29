import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import ServiceCard from '../components/ServiceCard';
import StylistCard from '../components/StylistCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Home() {
  const [services, setServices] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }

      const [svcRes, stylistRes, galleryRes] = await Promise.all([
        supabase
          .from('services')
          .select('*, categories(name)')
          .eq('is_active', true)
          .limit(3),
        supabase
          .from('stylists')
          .select('*')
          .eq('is_active', true)
          .order('rating_avg', { ascending: false })
          .limit(3),
        supabase
          .from('gallery')
          .select('*')
          .eq('is_featured', true)
          .limit(4),
      ]);
      if (!mounted) return;
      setServices(svcRes.data || []);
      setStylists(stylistRes.data || []);
      setGallery(galleryRes.data || []);
      setLoading(false);
    }
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-secondary text-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 py-28 md:py-36 relative z-10">
          <p className="font-body text-xs tracking-[0.3em] uppercase text-primary-light mb-4">
            Hair · Nails · Skin · Makeup
          </p>
          <h1 className="font-heading text-5xl md:text-6xl leading-tight max-w-2xl">
            Wear your crown with confidence.
          </h1>
          <p className="font-body text-white/70 mt-6 max-w-lg text-lg leading-relaxed">
            Angie&apos;s Crown is a full-service salon where every visit is tailored
            to you — precise cuts, dimensional color, and skincare that shows.
          </p>
          <div className="flex flex-wrap gap-4 mt-10">
            <Link
              to="/booking"
              className="font-body font-semibold bg-primary text-white px-7 py-3.5 rounded-sm hover:bg-primary-dark transition-colors"
            >
              Book an Appointment
            </Link>
            <Link
              to="/services"
              className="font-body font-semibold border border-white/30 text-white px-7 py-3.5 rounded-sm hover:bg-white/10 transition-colors"
            >
              View Services
            </Link>
          </div>
        </div>
        <div className="absolute -right-24 -bottom-24 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
      </section>

      {loading ? (
        <LoadingSpinner label="Loading the salon…" />
      ) : (
        <>
          {/* Featured services */}
          <section className="max-w-6xl mx-auto px-6 py-20">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="font-body text-xs uppercase tracking-wide text-primary font-semibold mb-2">Popular</p>
                <h2 className="font-heading text-3xl text-ink">Signature Services</h2>
              </div>
              <Link to="/services" className="font-body text-sm text-primary font-semibold hover:text-primary-dark">
                See all services →
              </Link>
            </div>
            {services.length === 0 ? (
              <p className="font-body text-muted">Services will appear here soon.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {services.map((s) => (
                  <ServiceCard key={s.id} service={s} categoryName={s.categories?.name} />
                ))}
              </div>
            )}
          </section>

          {/* Featured stylists */}
          <section className="bg-accent/40 py-20">
            <div className="max-w-6xl mx-auto px-6">
              <div className="flex items-end justify-between mb-10">
                <div>
                  <p className="font-body text-xs uppercase tracking-wide text-primary font-semibold mb-2">Meet the team</p>
                  <h2 className="font-heading text-3xl text-ink">Our Stylists</h2>
                </div>
                <Link to="/stylists" className="font-body text-sm text-primary font-semibold hover:text-primary-dark">
                  Meet everyone →
                </Link>
              </div>
              {stylists.length === 0 ? (
                <p className="font-body text-muted">Stylist profiles will appear here soon.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {stylists.map((s) => (
                    <StylistCard key={s.id} stylist={s} />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Gallery preview */}
          {gallery.length > 0 && (
            <section className="max-w-6xl mx-auto px-6 py-20">
              <div className="flex items-end justify-between mb-10">
                <div>
                  <p className="font-body text-xs uppercase tracking-wide text-primary font-semibold mb-2">Portfolio</p>
                  <h2 className="font-heading text-3xl text-ink">Recent Work</h2>
                </div>
                <Link to="/gallery" className="font-body text-sm text-primary font-semibold hover:text-primary-dark">
                  View gallery →
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {gallery.map((g) => (
                  <div key={g.id} className="aspect-[4/5] rounded-md overflow-hidden bg-accent">
                    <img src={g.image_url} alt={g.title || 'Salon work'} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* CTA */}
          <section className="max-w-6xl mx-auto px-6 pb-24">
            <div className="bg-primary rounded-lg px-10 py-14 text-center text-white">
              <h2 className="font-heading text-3xl mb-3">Ready for your next look?</h2>
              <p className="font-body text-white/80 mb-8 max-w-md mx-auto">
                Pick a service, choose your stylist, and book a time that works for you — all in a couple of minutes.
              </p>
              <Link
                to="/booking"
                className="inline-block font-body font-semibold bg-white text-primary px-8 py-3.5 rounded-sm hover:bg-accent transition-colors"
              >
                Book Now
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
