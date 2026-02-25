import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { getCards, getCardById, getSets } from '../handlers/cards';
import * as cardService from '../services/cardService';

jest.mock('../services/cardService');

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
  image_url: null,
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
      const result = (await getCards(event)) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body as string);
      expect(body.success).toBe(true);
      expect(body.data.data).toHaveLength(1);
      expect(body.data.data[0].name).toBe('Charizard');
    });

    it('should handle service errors', async () => {
      mockCardService.getCards.mockRejectedValue(new Error('DB error'));

      const event = makeEvent();
      const result = (await getCards(event)) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body as string);
      expect(body.success).toBe(false);
    });
  });

  describe('getCardById', () => {
    it('should return a card by id', async () => {
      mockCardService.getCardById.mockResolvedValue(sampleCard);

      const event = makeEvent({ pathParameters: { id: '1' } });
      const result = (await getCardById(event)) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body as string);
      expect(body.data.name).toBe('Charizard');
    });

    it('should return 404 for non-existent card', async () => {
      mockCardService.getCardById.mockResolvedValue(null);

      const event = makeEvent({ pathParameters: { id: '999' } });
      const result = (await getCardById(event)) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(404);
    });

    it('should return 400 for invalid card id', async () => {
      const event = makeEvent({ pathParameters: { id: 'abc' } });
      const result = (await getCardById(event)) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(400);
    });
  });

  describe('getSets', () => {
    it('should return sets', async () => {
      const sampleSets = [
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
      mockCardService.getSets.mockResolvedValue(sampleSets);

      const event = makeEvent();
      const result = (await getSets(event)) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body as string);
      expect(body.success).toBe(true);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].name).toBe('Pokemon 151');
    });

    it('should handle service errors', async () => {
      mockCardService.getSets.mockRejectedValue(new Error('DB error'));

      const event = makeEvent();
      const result = (await getSets(event)) as APIGatewayProxyStructuredResultV2;

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body as string);
      expect(body.success).toBe(false);
    });
  });
});
