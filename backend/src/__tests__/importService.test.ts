import { importFromApi } from '../services/importService';
import * as db from '../utils/db';
import type { Pool, PoolClient } from 'pg';

jest.mock('../utils/db');
const mockDb = db as jest.Mocked<typeof db>;

const mockFetch = jest.fn();
global.fetch = mockFetch;

function createMockClient(): jest.Mocked<PoolClient> {
  return {
    query: jest.fn(),
    release: jest.fn(),
  } as unknown as jest.Mocked<PoolClient>;
}

function createMockPool(client: jest.Mocked<PoolClient>): jest.Mocked<Pool> {
  return {
    connect: jest.fn().mockResolvedValue(client),
  } as unknown as jest.Mocked<Pool>;
}

function mockJsonResponse(data: unknown) {
  return {
    ok: true,
    status: 200,
    headers: new Headers(),
    json: async () => data,
  };
}

// ── TCGdex mock data ───────────────────────────────────────

const sampleSetSummary = {
  id: 'sv04',
  name: 'Paradox Rift',
  logo: 'https://assets.tcgdex.net/en/sv/sv04/logo',
  symbol: 'https://assets.tcgdex.net/univ/sv/sv04/symbol',
  cardCount: { total: 266, official: 182 },
};

const sampleSetDetail = {
  ...sampleSetSummary,
  serie: { id: 'sv', name: 'Scarlet & Violet' },
  releaseDate: '2023-11-03',
  cardCount: {
    total: 266,
    official: 182,
    holo: 0,
    reverse: 0,
    normal: 0,
    firstEd: 0,
  },
  cards: [
    {
      id: 'sv04-001',
      localId: '001',
      name: 'Caterpie',
      image: 'https://assets.tcgdex.net/en/sv/sv04/001',
    },
  ],
};

const sampleFullCard = {
  id: 'sv04-001',
  localId: '001',
  name: 'Caterpie',
  image: 'https://assets.tcgdex.net/en/sv/sv04/001',
  category: 'Pokemon',
  rarity: 'Common',
  hp: 50,
  types: ['Grass'],
  stage: 'Basic',
  dexId: [10],
  variants: {
    firstEdition: false,
    holo: false,
    normal: true,
    reverse: true,
    wPromo: false,
  },
  set: {
    id: 'sv04',
    name: 'Paradox Rift',
    cardCount: { official: 182, total: 266 },
  },
};

// ── Standard mock DB setup ─────────────────────────────────

function setupStandardQueryMock(
  client: jest.Mocked<PoolClient>,
  overrides?: { setExists?: boolean },
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (client.query as any).mockImplementation(async (text: string) => {
    const sql = typeof text === 'string' ? text : '';

    if (sql.includes('FROM rarities')) {
      return {
        rows: [
          { rarity_id: 1, name: 'Common' },
          { rarity_id: 2, name: 'Uncommon' },
          { rarity_id: 3, name: 'Rare' },
        ],
      };
    }
    if (sql.includes('FROM card_types')) {
      return {
        rows: [
          { card_type_id: 1, name: 'Pokémon' },
          { card_type_id: 2, name: 'Trainer - Item' },
          { card_type_id: 3, name: 'Trainer - Supporter' },
          { card_type_id: 5, name: 'Energy' },
        ],
      };
    }
    if (sql.includes('FROM energy_types')) {
      return {
        rows: [
          { energy_type_id: 1, name: 'Grass' },
          { energy_type_id: 2, name: 'Fire' },
          { energy_type_id: 11, name: 'None' },
        ],
      };
    }
    if (sql.includes('FROM sets WHERE api_id')) {
      if (overrides?.setExists) {
        return { rows: [{ set_id: 10 }] };
      }
      return { rows: [] };
    }
    if (sql.includes('INSERT INTO sets')) {
      return { rows: [{ set_id: 10 }] };
    }
    if (sql.includes('FROM cards WHERE api_id')) {
      return { rows: [] };
    }
    if (sql.includes('FROM cards') && sql.includes('set_id')) {
      return { rows: [] };
    }
    if (sql.includes('INSERT INTO cards')) {
      return { rows: [{ card_id: 100 }] };
    }
    return { rows: [] };
  });
}

// ── Tests ──────────────────────────────────────────────────

describe('importService', () => {
  let mockClient: jest.Mocked<PoolClient>;
  let mockPool: jest.Mocked<Pool>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    mockClient = createMockClient();
    mockPool = createMockPool(mockClient);
    mockDb.getPool.mockReturnValue(mockPool);
  });

  describe('dry run', () => {
    it('should report set and card counts without writing to DB', async () => {
      // TCGdex returns array directly (no pagination wrapper)
      mockFetch.mockResolvedValueOnce(mockJsonResponse([sampleSetSummary]));

      const result = await importFromApi({
        dryRun: true,
        setIds: ['sv04'],
      });

      expect(result.setsImported).toBe(1);
      expect(result.cardsImported).toBe(sampleSetSummary.cardCount.total);
      expect(mockPool.connect).not.toHaveBeenCalled();
    });
  });

  describe('actual import', () => {
    beforeEach(() => {
      setupStandardQueryMock(mockClient);
    });

    it('should import a new set and its cards', async () => {
      // 1st: fetch sets list
      mockFetch.mockResolvedValueOnce(mockJsonResponse([sampleSetSummary]));
      // 2nd: fetch set detail
      mockFetch.mockResolvedValueOnce(mockJsonResponse(sampleSetDetail));
      // 3rd: fetch individual card
      mockFetch.mockResolvedValueOnce(mockJsonResponse(sampleFullCard));

      const result = await importFromApi({ setIds: ['sv04'] });

      expect(result.errors).toHaveLength(0);
      expect(result.setsImported).toBe(1);
      expect(result.setsSkipped).toBe(0);
      expect(result.cardsImported).toBe(1);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should skip existing sets when force is false', async () => {
      setupStandardQueryMock(mockClient, { setExists: true });

      mockFetch.mockResolvedValueOnce(mockJsonResponse([sampleSetSummary]));
      // Set detail still fetched to get series/cards
      mockFetch.mockResolvedValueOnce(mockJsonResponse(sampleSetDetail));

      const result = await importFromApi({
        setIds: ['sv04'],
        force: false,
      });

      expect(result.setsSkipped).toBe(1);
      expect(result.setsImported).toBe(0);
    });

    it('should call progress callback', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse([sampleSetSummary]));
      mockFetch.mockResolvedValueOnce(mockJsonResponse(sampleSetDetail));
      mockFetch.mockResolvedValueOnce(mockJsonResponse(sampleFullCard));

      const progressEvents: Array<{ phase: string; message: string }> = [];
      await importFromApi({
        setIds: ['sv04'],
        onProgress: (event) => {
          progressEvents.push({ phase: event.phase, message: event.message });
        },
      });

      expect(progressEvents.length).toBeGreaterThan(0);
      expect(progressEvents.some((e) => e.phase === 'sets')).toBe(true);
      expect(progressEvents.some((e) => e.phase === 'cards')).toBe(true);
    });

    it('should capture set-level errors without crashing', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse([sampleSetSummary]));
      // Set detail fetch fails
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await importFromApi({ setIds: ['sv04'] });

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].setId).toBe('sv04');
      expect(mockClient.release).toHaveBeenCalled();
    }, 30000);

    it('should handle Trainer cards', async () => {
      const trainerCard = {
        ...sampleFullCard,
        id: 'sv04-180',
        localId: '180',
        name: 'Professor Turo',
        category: 'Trainer',
        rarity: 'Uncommon',
        types: undefined as string[] | undefined,
        dexId: undefined as number[] | undefined,
        stage: undefined as string | undefined,
        hp: undefined as number | undefined,
      };

      const setWithTrainer = {
        ...sampleSetDetail,
        cards: [
          {
            id: 'sv04-180',
            localId: '180',
            name: 'Professor Turo',
            image: 'https://assets.tcgdex.net/en/sv/sv04/180',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce(mockJsonResponse([sampleSetSummary]));
      mockFetch.mockResolvedValueOnce(mockJsonResponse(setWithTrainer));
      mockFetch.mockResolvedValueOnce(mockJsonResponse(trainerCard));

      const result = await importFromApi({ setIds: ['sv04'] });

      expect(result.errors).toHaveLength(0);
      expect(result.cardsImported).toBe(1);
    });

    it('should handle Energy cards', async () => {
      const energyCard = {
        ...sampleFullCard,
        id: 'sv04-200',
        localId: '200',
        name: 'Basic Fire Energy',
        category: 'Energy',
        rarity: 'Common',
        types: ['Fire'],
        dexId: undefined as number[] | undefined,
        stage: undefined as string | undefined,
      };

      const setWithEnergy = {
        ...sampleSetDetail,
        cards: [
          {
            id: 'sv04-200',
            localId: '200',
            name: 'Basic Fire Energy',
            image: 'https://assets.tcgdex.net/en/sv/sv04/200',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce(mockJsonResponse([sampleSetSummary]));
      mockFetch.mockResolvedValueOnce(mockJsonResponse(setWithEnergy));
      mockFetch.mockResolvedValueOnce(mockJsonResponse(energyCard));

      const result = await importFromApi({ setIds: ['sv04'] });

      expect(result.errors).toHaveLength(0);
      expect(result.cardsImported).toBe(1);
    });

    it('should work in quick mode without individual card fetches', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse([sampleSetSummary]));
      mockFetch.mockResolvedValueOnce(mockJsonResponse(sampleSetDetail));
      // No individual card fetch should happen in quick mode

      const result = await importFromApi({
        setIds: ['sv04'],
        quick: true,
      });

      expect(result.errors).toHaveLength(0);
      expect(result.cardsImported).toBe(1);
      // Only 2 fetch calls: sets list + set detail (no individual card)
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
