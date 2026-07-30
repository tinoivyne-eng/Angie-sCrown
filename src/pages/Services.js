import React, { useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import ServiceCard from '../components/ServiceCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import BeautyImageStrip from '../components/BeautyImageStrip';

export default function Services() {
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }

      const [catRes, svcRes] = await Promise.all([
        supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('services').select('*, categories(name, slug)').eq('is_active', true).order('name'),
      ]);
      if (!mounted) return;
      setCategories(catRes.data || []);
      setServices(svcRes.data || []);
      setLoading(false);
    }
    load();
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return services;
    return services.filter((s) => s.categories?.slug === activeCategory);
  }, [services, activeCategory]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-10 items-center mb-14">
        <div className="text-left max-w-xl">
        <p className="font-body text-xs uppercase tracking-wide text-primary font-semibold mb-2">Menu</p>
        <h1 className="font-heading text-4xl text-ink mb-3">Our Services</h1>
        <p className="font-body text-muted">
          From silk presses and curls to protective styles and color, every service is priced up front with no surprises.
        </p>
        </div>
        <BeautyImageStrip />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            <button
              onClick={() => setActiveCategory('all')}
              className={`font-body text-sm px-4 py-2 rounded-full border transition-colors ${
                activeCategory === 'all' ? 'bg-primary text-white border-primary' : 'border-line text-ink/70 hover:border-primary'
              }`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.slug)}
                className={`font-body text-sm px-4 py-2 rounded-full border transition-colors ${
                  activeCategory === c.slug ? 'bg-primary text-white border-primary' : 'border-line text-ink/70 hover:border-primary'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="No services here yet" description="Check back soon, or try a different category." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((s) => (
                <ServiceCard key={s.id} service={s} categoryName={s.categories?.name} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
