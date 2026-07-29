import React from 'react';

const STYLES = {
  error: 'bg-danger/10 text-danger border-danger/30',
  success: 'bg-success/10 text-success border-success/30',
  info: 'bg-primary/10 text-primary border-primary/30',
  warning: 'bg-warning/10 text-warning border-warning/30',
};

export default function Alert({ type = 'info', children }) {
  if (!children) return null;
  return (
    <div className={`border rounded-sm px-4 py-3 font-body text-sm ${STYLES[type]}`} role="alert">
      {children}
    </div>
  );
}
