import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import {
  getCollection,
  getCollectionEntry,
  addToCollection,
  updateCollectionEntry,
  removeFromCollection,
  getCompletionSummary,
} from '../handlers/collections';
import * as collectionService from '../services/collectionService';

jest.mock('../services/collectionService');

const mockService = collectionService as jest.Mocked<typeof collectionService>;

function makeEvent(overrides: Partial<APIGatewayProxyEventV2> = {}): APIGatewayProxyEventV2 {
  return {
    version: '2.0',
    routeKey: 'GET /api/collection',
    rawPath: '/api/collection',
    rawQueryString: '',
    headers: {},
    isBase64Encoded: false,
    requestContext: {} as APIGatewayProxyEventV2['requestContext'],
    ...overrides,
  };
}

const sampleEntry = {
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
  image_url: null,
};

const sampleRow = {
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

describe('Collections Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCollection', () => {
    it('should return all collection entries', async () => {
      mockService.getCollection.mockResolvedValue([sampleEntry]);

      const result = (await getCollection(makeEvent())) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body as string);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].name).toBe('Charizard');
    });

    it('should handle service errors', async () => {
      mockService.getCollection.mockRejectedValue(new Error('DB error'));

      const result = (await getCollection(makeEvent())) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(500);
    });

    it('should handle non-Error throws', async () => {
      mockService.getCollection.mockRejectedValue('unknown');

      const result = (await getCollection(makeEvent())) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body as string);
      expect(body.error).toBe('Failed to fetch collection');
    });
  });

  describe('getCollectionEntry', () => {
    it('should return a single entry by id', async () => {
      mockService.getCollectionEntryById.mockResolvedValue(sampleEntry);

      const event = makeEvent({ pathParameters: { id: '1' } });
      const result = (await getCollectionEntry(event)) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body as string);
      expect(body.data.name).toBe('Charizard');
    });

    it('should return 404 when entry not found', async () => {
      mockService.getCollectionEntryById.mockResolvedValue(null);

      const event = makeEvent({ pathParameters: { id: '999' } });
      const result = (await getCollectionEntry(event)) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(404);
    });

    it('should return 400 for invalid id', async () => {
      const event = makeEvent({ pathParameters: { id: 'abc' } });
      const result = (await getCollectionEntry(event)) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(400);
    });

    it('should handle non-Error throws', async () => {
      mockService.getCollectionEntryById.mockRejectedValue('unknown');

      const event = makeEvent({ pathParameters: { id: '1' } });
      const result = (await getCollectionEntry(event)) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body as string);
      expect(body.error).toBe('Failed to fetch collection entry');
    });
  });

  describe('addToCollection', () => {
    it('should add a card to collection', async () => {
      mockService.addToCollection.mockResolvedValue(sampleRow);

      const event = makeEvent({
        body: JSON.stringify({ card_id: 1, variant: 'Standard' }),
      });
      const result = (await addToCollection(event)) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.body as string);
      expect(body.success).toBe(true);
    });

    it('should return 422 for invalid input', async () => {
      const event = makeEvent({
        body: JSON.stringify({ card_id: -1 }),
      });
      const result = (await addToCollection(event)) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(422);
    });

    it('should return 409 for duplicate entry', async () => {
      mockService.addToCollection.mockRejectedValue(new Error('duplicate key'));

      const event = makeEvent({
        body: JSON.stringify({ card_id: 1 }),
      });
      const result = (await addToCollection(event)) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(409);
    });

    it('should return 404 for non-existent card', async () => {
      mockService.addToCollection.mockRejectedValue(new Error('violates foreign key'));

      const event = makeEvent({
        body: JSON.stringify({ card_id: 9999 }),
      });
      const result = (await addToCollection(event)) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(404);
    });

    it('should return 500 for missing body', async () => {
      const event = makeEvent({ body: undefined });
      const result = (await addToCollection(event)) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(500);
    });

    it('should handle non-Error throws', async () => {
      mockService.addToCollection.mockRejectedValue('unknown');

      const event = makeEvent({
        body: JSON.stringify({ card_id: 1 }),
      });
      const result = (await addToCollection(event)) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body as string);
      expect(body.error).toBe('Failed to add to collection');
    });
  });

  describe('updateCollectionEntry', () => {
    it('should update a collection entry', async () => {
      const updatedRow = { ...sampleRow, quantity: 2 };
      mockService.updateCollectionEntry.mockResolvedValue(updatedRow);

      const event = makeEvent({
        pathParameters: { id: '1' },
        body: JSON.stringify({ quantity: 2 }),
      });
      const result = (await updateCollectionEntry(event)) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(200);
    });

    it('should return 404 when entry not found', async () => {
      mockService.updateCollectionEntry.mockResolvedValue(null);

      const event = makeEvent({
        pathParameters: { id: '999' },
        body: JSON.stringify({ quantity: 2 }),
      });
      const result = (await updateCollectionEntry(event)) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(404);
    });

    it('should return 400 for invalid id', async () => {
      const event = makeEvent({
        pathParameters: { id: 'abc' },
        body: JSON.stringify({ quantity: 2 }),
      });
      const result = (await updateCollectionEntry(event)) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(400);
    });

    it('should return 422 for empty update', async () => {
      const event = makeEvent({
        pathParameters: { id: '1' },
        body: JSON.stringify({}),
      });
      const result = (await updateCollectionEntry(event)) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(422);
    });

    it('should handle non-Error throws', async () => {
      mockService.updateCollectionEntry.mockRejectedValue('unknown');

      const event = makeEvent({
        pathParameters: { id: '1' },
        body: JSON.stringify({ quantity: 2 }),
      });
      const result = (await updateCollectionEntry(event)) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body as string);
      expect(body.error).toBe('Failed to update collection entry');
    });
  });

  describe('removeFromCollection', () => {
    it('should remove a collection entry', async () => {
      mockService.removeFromCollection.mockResolvedValue(true);

      const event = makeEvent({ pathParameters: { id: '1' } });
      const result = (await removeFromCollection(event)) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body as string);
      expect(body.data.message).toBe('Removed from collection');
    });

    it('should return 404 when entry not found', async () => {
      mockService.removeFromCollection.mockResolvedValue(false);

      const event = makeEvent({ pathParameters: { id: '999' } });
      const result = (await removeFromCollection(event)) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(404);
    });

    it('should return 400 for invalid id', async () => {
      const event = makeEvent({ pathParameters: { id: 'abc' } });
      const result = (await removeFromCollection(event)) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(400);
    });

    it('should handle non-Error throws', async () => {
      mockService.removeFromCollection.mockRejectedValue('unknown');

      const event = makeEvent({ pathParameters: { id: '1' } });
      const result = (await removeFromCollection(event)) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body as string);
      expect(body.error).toBe('Failed to remove from collection');
    });
  });

  describe('getCompletionSummary', () => {
    it('should return completion summary', async () => {
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
      mockService.getCompletionSummary.mockResolvedValue(summary);

      const result = (await getCompletionSummary(makeEvent())) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body as string);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].set_code).toBe('MEW');
    });

    it('should handle service errors', async () => {
      mockService.getCompletionSummary.mockRejectedValue(new Error('DB error'));

      const result = (await getCompletionSummary(makeEvent())) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(500);
    });
  });
});
