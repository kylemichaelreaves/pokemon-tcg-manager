const IMAGE_BASE_URL = process.env.IMAGE_BASE_URL || '';

export function toImageUrl(imagePath: string | null): string | null {
  if (!imagePath || !IMAGE_BASE_URL) return null;
  const base = IMAGE_BASE_URL.replace(/\/+$/, '');
  const path = imagePath.replace(/^\/+/, '');
  return `${base}/${path}`;
}
