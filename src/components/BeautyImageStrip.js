import React from 'react';
import { hairstyleImages } from '../lib/beautyImages';

export default function BeautyImageStrip({ className = '' }) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${className}`}>
      {hairstyleImages.map((image, index) => (
        <div
          key={image.src}
          className={`overflow-hidden rounded-md bg-accent shadow-soft ${index % 2 === 0 ? 'aspect-[4/5]' : 'aspect-[4/6] md:mt-8'}`}
        >
          <img
            src={image.src}
            alt={image.alt}
            className="h-full w-full object-cover"
            loading={index === 0 ? 'eager' : 'lazy'}
            decoding="async"
          />
        </div>
      ))}
    </div>
  );
}
