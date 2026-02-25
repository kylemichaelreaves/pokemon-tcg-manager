import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../../lib/api';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

function mockResponse(data: unknown, ok = true, status = 200) {
  mockFetch.mockResolvedValueOnce({
    ok,
    status,
    json: async () => ({ success: ok, data }),
  });
}

function mockErrorResponse(error: string, status = 400) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    json: async () => ({ success: false, error }),
  });
}

describe('API Client', () => {
  describe('cards', () => {
    it('lists cards with default params', async () => {
      const mockData = { data: [], total: 0, page: 1, limit: 20, total_pages: 0 };
      mockResponse(mockData);

      const result = await api.cards.list();
      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/cards'),
        expect.objectContaining({ headers: { 'Content-Type': 'application/json' } }),
      );
    });

    it('lists cards with query params', async () => {
      mockResponse({ data: [], total: 0, page: 2, limit: 10, total_pages: 0 });

      await api.cards.list({ page: 2, limit: 10, sort_by: 'name', sort_order: 'asc' });
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('page=2');
      expect(url).toContain('limit=10');
      expect(url).toContain('sort_by=name');
      expect(url).toContain('sort_order=asc');
    });

    it('lists cards with filter params', async () => {
      mockResponse({ data: [], total: 0, page: 1, limit: 20, total_pages: 0 });

      await api.cards.list({
        filters: { set_code: 'MEW', language: 'EN', search: 'Pikachu' },
      });
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('set_code=MEW');
      expect(url).toContain('language=EN');
      expect(url).toContain('search=Pikachu');
    });

    it('gets a card by id', async () => {
      const mockCard = { card_id: 1, name: 'Pikachu' };
      mockResponse(mockCard);

      const result = await api.cards.get(1);
      expect(result).toEqual(mockCard);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/cards/1'),
        expect.any(Object),
      );
    });

    it('throws on API error response', async () => {
      mockErrorResponse('Card not found', 404);

      await expect(api.cards.get(999)).rejects.toThrow('Card not found');
    });
  });

  describe('sets', () => {
    it('lists sets', async () => {
      mockResponse([{ set_id: 1, set_code: 'MEW', name: 'Pokemon 151' }]);
      const result = await api.sets.list();
      expect(result).toHaveLength(1);
      expect(result[0].set_code).toBe('MEW');
    });
  });

  describe('collection', () => {
    it('lists collection entries', async () => {
      mockResponse([]);
      const result = await api.collection.list();
      expect(result).toEqual([]);
    });

    it('adds a card to collection', async () => {
      const entry = { collection_id: 1, card_id: 5, variant: 'Standard', quantity: 1 };
      mockResponse(entry);

      const result = await api.collection.add({ card_id: 5 });
      expect(result.collection_id).toBe(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/collection'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('updates a collection entry', async () => {
      mockResponse({ collection_id: 1, quantity: 3 });

      const result = await api.collection.update(1, { quantity: 3 });
      expect(result.quantity).toBe(3);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/collection/1'),
        expect.objectContaining({ method: 'PUT' }),
      );
    });

    it('removes a collection entry', async () => {
      mockResponse(undefined);

      await api.collection.remove(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/collection/1'),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    it('gets completion summary', async () => {
      mockResponse([{ set_code: 'MEW', pct_complete: 50 }]);

      const result = await api.collection.summary();
      expect(result[0].pct_complete).toBe(50);
    });
  });

  describe('health', () => {
    it('checks health endpoint', async () => {
      mockResponse({ status: 'healthy', timestamp: '2024-01-01', database: 'connected' });
      const result = await api.health();
      expect(result.status).toBe('healthy');
    });
  });
});
