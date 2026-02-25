import * as cardService from '../services/cardService';
import * as db from '../utils/db';
import { Card } from '../types';

jest.mock('../utils/db');
jest.mock('../utils/imageUrl', () => ({
  toImageUrl: jest.fn((path: string | null) => (path ? `https://img.test/${path}` : null)),
}));

const mockDb = db as jest.Mocked<typeof db>;

const sampleCard: Card = {
  card_id: 1,
  name: 'Charizard',
  set_name: 'Pokemon 151',
  set_code: 'MEW',
  card_number: '006/165',
  language: 'EN',
  pokedex_number: 6,
  name_local: null,
  card_type: 'Pokemon',
  energy_type: 'Fire',
  rarity: 'Rare',
  is_pokemon_ex: false,
  is_secret_rare: false,
  is_promo: false,
  has_holo_variant: true,
  image_path: 'cards/mew/006.png',
};

describe('Card Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCards', () => {
    it('should return paginated cards with image URLs', async () => {
      mockDb.queryOne.mockResolvedValue({ count: '1' });
      mockDb.query.mockResolvedValue([sampleCard]);

      const result = await cardService.getCards({ page: 1, limit: 20 }, {});

      expect(result.data).toHaveLength(1);
      expect(result.data[0].image_url).toBe('https://img.test/cards/mew/006.png');
      expect(result.data[0]).not.toHaveProperty('image_path');
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.total_pages).toBe(1);
    });

    it('should handle empty results', async () => {
      mockDb.queryOne.mockResolvedValue({ count: '0' });
      mockDb.query.mockResolvedValue([]);

      const result = await cardService.getCards({ page: 1, limit: 20 }, {});

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.total_pages).toBe(0);
    });

    it('should apply set_code filter', async () => {
      mockDb.queryOne.mockResolvedValue({ count: '1' });
      mockDb.query.mockResolvedValue([sampleCard]);

      await cardService.getCards({ page: 1, limit: 20 }, { set_code: 'MEW' });

      expect(mockDb.queryOne).toHaveBeenCalledWith(expect.stringContaining('set_code = $1'), [
        'MEW',
      ]);
    });

    it('should apply language filter', async () => {
      mockDb.queryOne.mockResolvedValue({ count: '1' });
      mockDb.query.mockResolvedValue([sampleCard]);

      await cardService.getCards({ page: 1, limit: 20 }, { language: 'EN' });

      expect(mockDb.queryOne).toHaveBeenCalledWith(expect.stringContaining('language = $1'), [
        'EN',
      ]);
    });

    it('should apply rarity filter', async () => {
      mockDb.queryOne.mockResolvedValue({ count: '1' });
      mockDb.query.mockResolvedValue([sampleCard]);

      await cardService.getCards({ page: 1, limit: 20 }, { rarity: 'Rare' });

      expect(mockDb.queryOne).toHaveBeenCalledWith(expect.stringContaining('rarity = $1'), [
        'Rare',
      ]);
    });

    it('should apply card_type filter', async () => {
      mockDb.queryOne.mockResolvedValue({ count: '1' });
      mockDb.query.mockResolvedValue([sampleCard]);

      await cardService.getCards({ page: 1, limit: 20 }, { card_type: 'Pokemon' });

      expect(mockDb.queryOne).toHaveBeenCalledWith(expect.stringContaining('card_type = $1'), [
        'Pokemon',
      ]);
    });

    it('should apply energy_type filter', async () => {
      mockDb.queryOne.mockResolvedValue({ count: '1' });
      mockDb.query.mockResolvedValue([sampleCard]);

      await cardService.getCards({ page: 1, limit: 20 }, { energy_type: 'Fire' });

      expect(mockDb.queryOne).toHaveBeenCalledWith(expect.stringContaining('energy_type = $1'), [
        'Fire',
      ]);
    });

    it('should apply boolean filters', async () => {
      mockDb.queryOne.mockResolvedValue({ count: '1' });
      mockDb.query.mockResolvedValue([sampleCard]);

      await cardService.getCards(
        { page: 1, limit: 20 },
        { is_pokemon_ex: true, is_secret_rare: false, is_promo: true },
      );

      expect(mockDb.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('is_pokemon_ex'),
        expect.arrayContaining([true, false, true]),
      );
    });

    it('should apply search filter with ILIKE', async () => {
      mockDb.queryOne.mockResolvedValue({ count: '1' });
      mockDb.query.mockResolvedValue([sampleCard]);

      await cardService.getCards({ page: 1, limit: 20 }, { search: 'Char' });

      expect(mockDb.queryOne).toHaveBeenCalledWith(expect.stringContaining('ILIKE'), ['%Char%']);
    });

    it('should apply sort_by and sort_order', async () => {
      mockDb.queryOne.mockResolvedValue({ count: '1' });
      mockDb.query.mockResolvedValue([sampleCard]);

      await cardService.getCards({ page: 1, limit: 20, sort_by: 'name', sort_order: 'desc' }, {});

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY name DESC'),
        expect.any(Array),
      );
    });

    it('should default to set_code, card_number sort for unknown sort_by', async () => {
      mockDb.queryOne.mockResolvedValue({ count: '1' });
      mockDb.query.mockResolvedValue([sampleCard]);

      await cardService.getCards({ page: 1, limit: 20, sort_by: 'unknown_column' }, {});

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY set_code, card_number ASC'),
        expect.any(Array),
      );
    });

    it('should handle null count result', async () => {
      mockDb.queryOne.mockResolvedValue(null);
      mockDb.query.mockResolvedValue([]);

      const result = await cardService.getCards({ page: 1, limit: 20 }, {});

      expect(result.total).toBe(0);
    });
  });

  describe('getCardById', () => {
    it('should return card with image URL', async () => {
      mockDb.queryOne.mockResolvedValue(sampleCard);

      const result = await cardService.getCardById(1);

      expect(result).not.toBeNull();
      expect(result!.image_url).toBe('https://img.test/cards/mew/006.png');
    });

    it('should return null when card not found', async () => {
      mockDb.queryOne.mockResolvedValue(null);

      const result = await cardService.getCardById(999);

      expect(result).toBeNull();
    });
  });

  describe('getSets', () => {
    it('should return sets from database', async () => {
      const sets = [
        {
          set_id: 1,
          set_code: 'MEW',
          name: 'Pokemon 151',
          series: 'Scarlet & Violet',
          language: 'EN',
          release_date: '2023-09-22',
          total_cards: 165,
          total_with_sr: 207,
        },
      ];
      mockDb.query.mockResolvedValue(sets);

      const result = await cardService.getSets();

      expect(result).toEqual(sets);
      expect(mockDb.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
    });
  });
});
