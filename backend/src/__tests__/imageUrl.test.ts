import { toImageUrl } from '../utils/imageUrl';

describe('toImageUrl', () => {
  const originalEnv = process.env.IMAGE_BASE_URL;

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.IMAGE_BASE_URL = originalEnv;
    } else {
      delete process.env.IMAGE_BASE_URL;
    }
  });

  it('should combine base URL and path', () => {
    process.env.IMAGE_BASE_URL = 'https://images.example.com';
    expect(toImageUrl('cards/mew/006.png')).toBe('https://images.example.com/cards/mew/006.png');
  });

  it('should strip trailing slashes from base URL', () => {
    process.env.IMAGE_BASE_URL = 'https://images.example.com///';
    expect(toImageUrl('cards/mew/006.png')).toBe('https://images.example.com/cards/mew/006.png');
  });

  it('should strip leading slashes from path', () => {
    process.env.IMAGE_BASE_URL = 'https://images.example.com';
    expect(toImageUrl('///cards/mew/006.png')).toBe('https://images.example.com/cards/mew/006.png');
  });

  it('should return null when path is null', () => {
    process.env.IMAGE_BASE_URL = 'https://images.example.com';
    expect(toImageUrl(null)).toBeNull();
  });

  it('should return null when path is empty string', () => {
    process.env.IMAGE_BASE_URL = 'https://images.example.com';
    expect(toImageUrl('')).toBeNull();
  });

  it('should return null when IMAGE_BASE_URL is not set', () => {
    delete process.env.IMAGE_BASE_URL;
    expect(toImageUrl('cards/mew/006.png')).toBeNull();
  });

  it('should return null when IMAGE_BASE_URL is empty', () => {
    process.env.IMAGE_BASE_URL = '';
    expect(toImageUrl('cards/mew/006.png')).toBeNull();
  });
});
