import React from 'react';

export default function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-2 py-16 px-6 border border-dashed border-line rounded-lg bg-surface">
      <h3 className="font-heading text-xl text-ink">{title}</h3>
      {description && <p className="font-body text-sm text-muted max-w-sm">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
