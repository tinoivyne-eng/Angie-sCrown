import React from 'react';
import { Link } from 'react-router-dom';

export default function StylistCard({ stylist }) {
  return (
    <div className="bg-surface border border-line rounded-md overflow-hidden hover:shadow-medium transition-shadow flex flex-col">
      <div className="aspect-[4/5] bg-accent flex items-center justify-center">
        {stylist.avatar_url ? (
          <img src={stylist.avatar_url} alt={stylist.full_name} className="w-full h-full object-cover" />
        ) : (
          <span className="font-heading text-5xl text-primary/40">
            {stylist.full_name.charAt(0)}
          </span>
        )}
      </div>
      <div className="p-5 flex flex-col gap-2 flex-1">
        <h3 className="font-heading text-lg text-ink">{stylist.full_name}</h3>
        {stylist.specialties?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {stylist.specialties.map((s) => (
              <span key={s} className="font-body text-xs bg-accent text-primary px-2 py-0.5 rounded-full">
                {s}
              </span>
            ))}
          </div>
        )}
        {stylist.bio && <p className="font-body text-sm text-muted leading-relaxed flex-1">{stylist.bio}</p>}
        <div className="flex items-center justify-between pt-2 mt-auto">
          <span className="font-body text-xs text-muted">
            {stylist.rating_count > 0 ? `★ ${stylist.rating_avg.toFixed(1)} (${stylist.rating_count})` : 'New stylist'}
          </span>
          <Link
            to={`/booking?stylist=${stylist.id}`}
            className="font-body text-sm font-semibold text-primary hover:text-primary-dark"
          >
            Book →
          </Link>
        </div>
      </div>
    </div>
  );
}
