const MAX_IMAGE_DIMENSION = 1920;
const WEBP_QUALITY = 0.82;

function webpFileName(name) {
  const baseName = name.replace(/\.[^/.]+$/, '') || 'gallery-image';
  return `${baseName}.webp`;
}

/**
 * Resizes large images and converts them to WebP before they are uploaded.
 * This keeps gallery downloads fast while retaining good visual quality.
 */
export function compressImageToWebp(file) {
  if (!file.type.startsWith('image/')) {
    return Promise.reject(new Error('Please select an image file.'));
  }

  if (file.type === 'image/gif') {
    return Promise.reject(new Error('GIF files are not supported because compression would remove their animation.'));
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    const sourceUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(sourceUrl);

      const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Your browser could not prepare this image for upload.'));
        return;
      }

      context.drawImage(image, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Your browser could not compress this image.'));
          return;
        }
        resolve(new File([blob], webpFileName(file.name), { type: 'image/webp' }));
      }, 'image/webp', WEBP_QUALITY);
    };

    image.onerror = () => {
      URL.revokeObjectURL(sourceUrl);
      reject(new Error('This image could not be read. Please choose a JPG, PNG, or WebP file.'));
    };

    image.src = sourceUrl;
  });
}
