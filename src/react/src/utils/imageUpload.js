function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const imageUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(imageUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error('Failed to process image'));
    };

    image.src = imageUrl;
  });
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to optimize image'));
        return;
      }
      resolve(blob);
    }, mimeType, quality);
  });
}

export async function optimizeImageForUpload(
  file,
  { maxDimension = 1024, maxFileSizeMB = 2, initialQuality = 0.9 } = {}
) {
  if (!file || !String(file.type || '').startsWith('image/')) {
    throw new Error('Please select a valid image file');
  }

  const maxBytes = maxFileSizeMB * 1024 * 1024;
  const image = await loadImageFromFile(file);
  const originalWidth = image.naturalWidth || image.width;
  const originalHeight = image.naturalHeight || image.height;

  const scale = Math.min(1, maxDimension / Math.max(originalWidth, originalHeight));
  const width = Math.max(1, Math.round(originalWidth * scale));
  const height = Math.max(1, Math.round(originalHeight * scale));

  if (scale === 1 && file.size <= maxBytes) {
    return file;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Image processing is not supported in this browser');
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, width, height);

  let mimeType = file.type;
  if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(mimeType)) {
    mimeType = 'image/jpeg';
  }

  let quality = initialQuality;
  let optimizedBlob = await canvasToBlob(canvas, mimeType, quality);

  if (optimizedBlob.size > maxBytes && (mimeType === 'image/jpeg' || mimeType === 'image/jpg' || mimeType === 'image/webp')) {
    while (optimizedBlob.size > maxBytes && quality > 0.55) {
      quality -= 0.1;
      optimizedBlob = await canvasToBlob(canvas, mimeType, quality);
    }
  }

  if (optimizedBlob.size > maxBytes && mimeType === 'image/png') {
    const jpegBlob = await canvasToBlob(canvas, 'image/jpeg', 0.88);
    if (jpegBlob.size < optimizedBlob.size) {
      optimizedBlob = jpegBlob;
      mimeType = 'image/jpeg';
    }
  }

  const originalBaseName = file.name.replace(/\.[^.]+$/, '');
  const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';

  return new File([optimizedBlob], `${originalBaseName}.${extension}`, {
    type: mimeType,
    lastModified: Date.now()
  });
}