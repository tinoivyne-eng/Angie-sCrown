import React from 'react';
import { Link } from 'react-router-dom';

export default function ServiceCard({ service, categoryName }) {
  return (
    <div className="bg-surface border border-line rounded-md p-6 flex flex-col gap-3 hover:shadow-medium transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div>
          {categoryName && (
            <span className="font-body text-xs uppercase tracking-wide text-primary font-semibold">
              {categoryName}
            </span>
          )}
          <h3 className="font-heading text-xl text-ink mt-1">{service.name}</h3>
        </div>
        <span className="font-heading text-lg text-primary shrink-0">${Number(service.price).toFixed(0)}</span>
      </div>
      {service.description && (
        <p className="font-body text-sm text-muted leading-relaxed">{service.description}</p>
      )}
      <div className="flex items-center justify-between mt-2 pt-3 border-t border-line">
        <span className="font-body text-xs text-muted">{service.duration_minutes} min</span>
        <Link
          to={`/booking?service=${service.id}`}
          className="font-body text-sm font-semibold text-primary hover:text-primary-dark"
        >
          Book this →
        </Link>
      </div>
    </div>
  );
}
