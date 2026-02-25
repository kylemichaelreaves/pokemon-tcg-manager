export function toImageUrl(imagePath: string | null): string | null {
  const baseUrl = process.env.IMAGE_BASE_URL || '';
  if (!imagePath || !baseUrl) return null;
  const base = baseUrl.replace(/\/+$/, '');
  const path = imagePath.replace(/^\/+/, '');
  return `${base}/${path}`;
}
