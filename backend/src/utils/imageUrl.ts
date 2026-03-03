export function toImageUrl(imagePath: string | null): string | null {
  if (!imagePath) return null;

  // Absolute URLs (from API imports) are returned as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Relative paths use IMAGE_BASE_URL (local/S3 images)
  const baseUrl = process.env.IMAGE_BASE_URL || '';
  if (!baseUrl) return null;
  const base = baseUrl.replace(/\/+$/, '');
  const path = imagePath.replace(/^\/+/, '');
  return `${base}/${path}`;
}
