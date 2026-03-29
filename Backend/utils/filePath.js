function toPublicUploadPath(filePath) {
  if (!filePath) return null;

  const normalized = String(filePath).replace(/\\/g, '/');
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized;
  }

  const marker = '/uploads/';
  const markerIndex = normalized.toLowerCase().lastIndexOf(marker);
  if (markerIndex >= 0) {
    return normalized.slice(markerIndex + 1);
  }

  return normalized.replace(/^\/+/, '');
}

module.exports = {
  toPublicUploadPath
};