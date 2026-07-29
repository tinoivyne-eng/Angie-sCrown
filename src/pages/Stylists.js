import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import StylistCard from '../components/StylistCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function Stylists() {
  const [stylists, setStylists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
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
      <div className="text-center max-w-2xl mx-auto mb-12">
        <p className="font-body text-xs uppercase tracking-wide text-primary font-semibold mb-2">Our Team</p>
        <h1 className="font-heading text-4xl text-ink mb-3">Meet the Stylists</h1>
        <p className="font-body text-muted">
          Every stylist at Angie&apos;s Crown brings their own point of view — find the one who matches yours.
        </p>
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
