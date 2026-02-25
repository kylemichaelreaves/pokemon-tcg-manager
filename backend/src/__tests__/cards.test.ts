import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { getCards, getCardById, createCard, updateCard, deleteCard } from '../../handlers/cards';
import * as cardService from '../../services/cardService';

jest.mock('../../services/cardService');

const mockCardService = cardService as jest.Mocked<typeof cardService>;

function makeEvent(overrides: Partial<APIGatewayProxyEventV2> = {}): APIGatewayProxyEventV2 {
  return {
    version: '2.0',
    routeKey: 'GET /api/cards',
    rawPath: '/api/cards',
    rawQueryString: '',
    headers: {},
    isBase64Encoded: false,
    requestContext: {} as APIGatewayProxyEventV2['requestContext'],
    ...overrides,
  };
}

const sampleCard = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Charizard',
  set_name: 'Base Set',
  set_code: 'base1',
  card_number: '4/102',
  rarity: 'rare_holo' as const,
  card_type: 'pokemon' as const,
  hp: 120,
  energy_type: 'fire' as const,
  image_url: null,
  market_price: 350.0,
  condition: 'near_mint' as const,
  notes: null,
  created_at: new Date(),
  updated_at: new Date(),
};

describe('Cards Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCards', () => {
    it('should return paginated cards', async () => {
      const paginatedResult = {
        data: [sampleCard],
        total: 1,
        page: 1,
        limit: 20,
        total_pages: 1,
      };
      mockCardService.getCards.mockResolvedValue(paginatedResult);

      const event = makeEvent({ queryStringParameters: { page: '1', limit: '20' } });
      const result = await getCards(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body as string);
      expect(body.success).toBe(true);
      expect(body.data.data).toHaveLength(1);
      expect(body.data.data[0].name).toBe('Charizard');
    });

    it('should handle service errors', async () => {
      mockCardService.getCards.mockRejectedValue(new Error('DB error'));

      const event = makeEvent();
      const result = await getCards(event);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body as string);
      expect(body.success).toBe(false);
    });
  });

  describe('getCardById', () => {
    it('should return a card by id', async () => {
      mockCardService.getCardById.mockResolvedValue(sampleCard);

      const event = makeEvent({ pathParameters: { id: sampleCard.id } });
      const result = await getCardById(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body as string);
      expect(body.data.name).toBe('Charizard');
    });

    it('should return 404 for non-existent card', async () => {
      mockCardService.getCardById.mockResolvedValue(null);

      const event = makeEvent({ pathParameters: { id: 'nonexistent' } });
      const result = await getCardById(event);

      expect(result.statusCode).toBe(404);
    });
  });

  describe('createCard', () => {
    it('should create a card with valid input', async () => {
      mockCardService.createCard.mockResolvedValue(sampleCard);

      const event = makeEvent({
        body: JSON.stringify({
          name: 'Charizard',
          set_name: 'Base Set',
          set_code: 'base1',
          card_number: '4/102',
          rarity: 'rare_holo',
          card_type: 'pokemon',
          hp: 120,
          energy_type: 'fire',
          condition: 'near_mint',
        }),
      });

      const result = await createCard(event);

      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.body as string);
      expect(body.data.name).toBe('Charizard');
    });

    it('should return 422 for invalid input', async () => {
      const event = makeEvent({
        body: JSON.stringify({ name: '' }),
      });

      const result = await createCard(event);

      expect(result.statusCode).toBe(422);
    });

    it('should return error for missing body', async () => {
      const event = makeEvent({ body: undefined });
      const result = await createCard(event);

      expect(result.statusCode).toBe(500);
    });
  });

  describe('updateCard', () => {
    it('should update a card', async () => {
      const updatedCard = { ...sampleCard, name: 'Charizard EX' };
      mockCardService.updateCard.mockResolvedValue(updatedCard);

      const event = makeEvent({
        pathParameters: { id: sampleCard.id },
        body: JSON.stringify({ name: 'Charizard EX' }),
      });

      const result = await updateCard(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body as string);
      expect(body.data.name).toBe('Charizard EX');
    });

    it('should return 404 if card not found', async () => {
      mockCardService.updateCard.mockResolvedValue(null);

      const event = makeEvent({
        pathParameters: { id: 'nonexistent' },
        body: JSON.stringify({ name: 'Test' }),
      });

      const result = await updateCard(event);

      expect(result.statusCode).toBe(404);
    });
  });

  describe('deleteCard', () => {
    it('should delete a card', async () => {
      mockCardService.deleteCard.mockResolvedValue(true);

      const event = makeEvent({ pathParameters: { id: sampleCard.id } });
      const result = await deleteCard(event);

      expect(result.statusCode).toBe(200);
    });

    it('should return 404 for non-existent card', async () => {
      mockCardService.deleteCard.mockResolvedValue(false);

      const event = makeEvent({ pathParameters: { id: 'nonexistent' } });
      const result = await deleteCard(event);

      expect(result.statusCode).toBe(404);
    });
  });
});
