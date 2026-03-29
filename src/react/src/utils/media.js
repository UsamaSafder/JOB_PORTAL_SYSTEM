export function toPublicFileUrl(filePath) {
  if (!filePath) return '';

  const normalizedRaw = String(filePath).replace(/\\/g, '/');
  const uploadsMarker = '/uploads/';
  const uploadsIndex = normalizedRaw.toLowerCase().lastIndexOf(uploadsMarker);
  const normalized = uploadsIndex >= 0
    ? normalizedRaw.slice(uploadsIndex + 1)
    : normalizedRaw;

  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized;
  }

  return `http://localhost:5001/${normalized.replace(/^\/+/, '')}`;
}
