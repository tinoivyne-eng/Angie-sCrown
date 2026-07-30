import React, { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import StylistCard from '../components/StylistCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import BeautyImageStrip from '../components/BeautyImageStrip';

export default function Stylists() {
  const [stylists, setStylists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    if (!isSupabaseConfigured) {
      setLoading(false);
      return () => { mounted = false; };
    }

    supabase
      .from('stylists')
      .select('*')
      .eq('is_active', true)
      .order('rating_avg', { ascending: false })
      .then(({ data }) => {
        if (!mounted) return;
        setStylists(data || []);
        setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center mb-14">
        <BeautyImageStrip />
        <div className="text-left max-w-xl lg:ml-auto">
        <p className="font-body text-xs uppercase tracking-wide text-primary font-semibold mb-2">Our Team</p>
        <h1 className="font-heading text-4xl text-ink mb-3">Meet the Stylists</h1>
        <p className="font-body text-muted">
          Every stylist at Angie&apos;s Crown brings their own point of view, from natural curls and braids to soft waves and polished finishes.
        </p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : stylists.length === 0 ? (
        <EmptyState title="No stylists listed yet" description="Our team profiles are on their way." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stylists.map((s) => (
            <StylistCard key={s.id} stylist={s} />
          ))}
        </div>
      )}
    </div>
  );
}
