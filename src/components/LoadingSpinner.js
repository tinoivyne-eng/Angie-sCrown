import React from 'react';

export default function LoadingSpinner({ label = 'Loading…', fullScreen = false }) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="h-8 w-8 rounded-full border-2 border-line border-t-primary animate-spin" />
      <p className="font-body text-sm text-muted">{label}</p>
    </div>
  );

  if (fullScreen) {
    return <div className="min-h-screen flex items-center justify-center bg-canvas">{content}</div>;
  }
  return content;
}
