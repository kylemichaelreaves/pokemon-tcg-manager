import * as collectionService from '../services/collectionService';
import * as db from '../utils/db';
import { CollectionEntry } from '../types';

jest.mock('../utils/db');
jest.mock('../utils/imageUrl', () => ({
  toImageUrl: jest.fn((path: string | null) =>
    path ? `https://images.example.com/${path}` : null,
  ),
}));

const mockDb = db as jest.Mocked<typeof db>;

const sampleDbEntry: CollectionEntry = {
  collection_id: 1,
  set_code: 'MEW',
  language: 'EN',
  card_number: '006/165',
  name: 'Charizard',
  rarity: 'Rare',
  variant: 'Standard',
  quantity: 1,
  condition: 'Near Mint',
  is_graded: false,
  grading_company: null,
  grade: null,
  date_acquired: null,
  purchase_price_usd: null,
  image_path: 'cards/mew/006.png',
};

describe('Collection Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCollection', () => {
    it('should return all entries with image URLs', async () => {
      mockDb.query.mockResolvedValue([sampleDbEntry]);

      const result = await collectionService.getCollection();

      expect(result).toHaveLength(1);
      expect(result[0].image_url).toBe('https://images.example.com/cards/mew/006.png');
      expect(result[0]).not.toHaveProperty('image_path');
    });

    it('should return empty array when no entries', async () => {
      mockDb.query.mockResolvedValue([]);

      const result = await collectionService.getCollection();

      expect(result).toHaveLength(0);
    });
  });

  describe('getCollectionEntryById', () => {
    it('should return entry with image URL', async () => {
      mockDb.queryOne.mockResolvedValue(sampleDbEntry);

      const result = await collectionService.getCollectionEntryById(1);

      expect(result).not.toBeNull();
      expect(result!.image_url).toBe('https://images.example.com/cards/mew/006.png');
      expect(result).not.toHaveProperty('image_path');
    });

    it('should return null when entry not found', async () => {
      mockDb.queryOne.mockResolvedValue(null);

      const result = await collectionService.getCollectionEntryById(999);

      expect(result).toBeNull();
    });
  });

  describe('addToCollection', () => {
    it('should insert and return the new row', async () => {
      const insertedRow = {
        collection_id: 1,
        card_id: 1,
        variant: 'Standard',
        quantity: 1,
        condition: 'Near Mint',
        is_graded: false,
        grading_company: null,
        grade: null,
        date_acquired: null,
        purchase_price_usd: null,
        notes: null,
      };
      mockDb.queryOne.mockResolvedValue(insertedRow);

      const result = await collectionService.addToCollection({ card_id: 1 });

      expect(result.collection_id).toBe(1);
      expect(mockDb.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO collection'),
        expect.arrayContaining([1]),
      );
    });

    it('should apply defaults for optional fields', async () => {
      const insertedRow = {
        collection_id: 2,
        card_id: 5,
        variant: 'Standard',
        quantity: 1,
        condition: 'Near Mint',
        is_graded: false,
        grading_company: null,
        grade: null,
        date_acquired: null,
        purchase_price_usd: null,
        notes: null,
      };
      mockDb.queryOne.mockResolvedValue(insertedRow);

      await collectionService.addToCollection({ card_id: 5 });

      expect(mockDb.queryOne).toHaveBeenCalledWith(expect.any(String), [
        5,
        'Standard',
        1,
        'Near Mint',
        false,
        null,
        null,
        null,
        null,
        null,
      ]);
    });

    it('should throw when insert fails', async () => {
      mockDb.queryOne.mockResolvedValue(null);

      await expect(collectionService.addToCollection({ card_id: 1 })).rejects.toThrow(
        'Failed to add to collection',
      );
    });
  });

  describe('updateCollectionEntry', () => {
    it('should update and return the row', async () => {
      const updatedRow = {
        collection_id: 1,
        card_id: 1,
        variant: 'Standard',
        quantity: 3,
        condition: 'Near Mint',
        is_graded: false,
        grading_company: null,
        grade: null,
        date_acquired: null,
        purchase_price_usd: null,
        notes: null,
      };
      mockDb.queryOne.mockResolvedValue(updatedRow);

      const result = await collectionService.updateCollectionEntry(1, { quantity: 3 });

      expect(result).not.toBeNull();
      expect(result!.quantity).toBe(3);
    });

    it('should return null when no fields provided', async () => {
      const result = await collectionService.updateCollectionEntry(1, {});

      expect(result).toBeNull();
      expect(mockDb.queryOne).not.toHaveBeenCalled();
    });

    it('should skip undefined values', async () => {
      mockDb.queryOne.mockResolvedValue(null);

      await collectionService.updateCollectionEntry(1, {
        quantity: 2,
        variant: undefined,
      });

      expect(mockDb.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('quantity = $1'),
        [2, 1],
      );
    });
  });

  describe('removeFromCollection', () => {
    it('should return true when entry is deleted', async () => {
      mockDb.queryOne.mockResolvedValue({ collection_id: 1 });

      const result = await collectionService.removeFromCollection(1);

      expect(result).toBe(true);
    });

    it('should return false when entry not found', async () => {
      mockDb.queryOne.mockResolvedValue(null);

      const result = await collectionService.removeFromCollection(999);

      expect(result).toBe(false);
    });
  });

  describe('getCompletionSummary', () => {
    it('should return completion summary from view', async () => {
      const summary = [
        {
          set_code: 'MEW',
          set_name: 'Pokemon 151',
          language: 'EN',
          total_cards: 165,
          secret_rares: 42,
          promos: 0,
          holo_variant_eligible: 50,
          owned_unique_cards: 80,
          owned_total_variants: 95,
          pct_complete: 48.48,
        },
      ];
      mockDb.query.mockResolvedValue(summary);

      const result = await collectionService.getCompletionSummary();

      expect(result).toEqual(summary);
      expect(mockDb.query).toHaveBeenCalledWith('SELECT * FROM v_completion_summary');
    });
  });
});
