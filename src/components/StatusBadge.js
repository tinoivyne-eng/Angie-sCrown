import React from 'react';

const STYLES = {
  pending: 'bg-warning/10 text-warning border-warning/30',
  confirmed: 'bg-primary/10 text-primary border-primary/30',
  completed: 'bg-success/10 text-success border-success/30',
  cancelled: 'bg-danger/10 text-danger border-danger/30',
  no_show: 'bg-secondary/10 text-secondary border-secondary/30',
  paid: 'bg-success/10 text-success border-success/30',
  failed: 'bg-danger/10 text-danger border-danger/30',
  refunded: 'bg-muted/10 text-muted border-muted/30',
  partially_refunded: 'bg-warning/10 text-warning border-warning/30',
};

const LABELS = {
  no_show: 'No-show',
  partially_refunded: 'Partial refund',
};

export default function StatusBadge({ status }) {
  const style = STYLES[status] || 'bg-muted/10 text-muted border-muted/30';
  const label = LABELS[status] || (status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown');
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-body font-medium capitalize ${style}`}>
      {label}
    </span>
  );
}
