import React, { useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import BeautyImageStrip from '../components/BeautyImageStrip';

export default function Gallery() {
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    let mounted = true;

    if (!isSupabaseConfigured) {
      setLoading(false);
      return () => { mounted = false; };
    }

    supabase
      .from('gallery')
      .select('*')
      .order('sort_order')
      .then(({ data }) => {
        if (!mounted) return;
        setItems(data || []);
        setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [items]);

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return items;
    return items.filter((i) => i.category === activeCategory);
  }, [items, activeCategory]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10 items-center mb-14">
        <div className="text-left max-w-xl">
        <p className="font-body text-xs uppercase tracking-wide text-primary font-semibold mb-2">Portfolio</p>
        <h1 className="font-heading text-4xl text-ink mb-3">Gallery</h1>
        <p className="font-body text-muted">A look at recent work, with styles for textured curls, sleek finishes, waves, braids, and event-ready hair.</p>
        </div>
        <BeautyImageStrip />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <EmptyState title="No photos yet" description="Check back soon for our latest work." />
      ) : (
        <>
          <div className="flex flex-wrap justify-center gap-2 mb-10 capitalize">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                className={`font-body text-sm px-4 py-2 rounded-full border transition-colors ${
                  activeCategory === c ? 'bg-primary text-white border-primary' : 'border-line text-ink/70 hover:border-primary'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="columns-2 md:columns-3 gap-4 space-y-4">
            {filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => setLightbox(item)}
                className="block w-full break-inside-avoid rounded-md overflow-hidden bg-accent"
              >
                <img
                  src={item.image_url}
                  alt={item.title || 'Salon work'}
                  className="w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </button>
            ))}
          </div>
        </>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-secondary/90 flex items-center justify-center p-6"
          onClick={() => setLightbox(null)}
        >
          <div className="max-w-2xl w-full bg-surface rounded-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.image_url} alt={lightbox.title || 'Salon work'} className="w-full max-h-[70vh] object-cover" />
            <div className="p-5">
              {lightbox.title && <h3 className="font-heading text-lg text-ink">{lightbox.title}</h3>}
              {lightbox.description && <p className="font-body text-sm text-muted mt-1">{lightbox.description}</p>}
              <button
                onClick={() => setLightbox(null)}
                className="mt-4 font-body text-sm font-semibold text-primary hover:text-primary-dark"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
