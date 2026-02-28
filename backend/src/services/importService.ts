import { getPool } from '../utils/db';
import type {
  TcgdexSetSummary,
  TcgdexSetDetail,
  TcgdexCard,
  TcgdexCardSummary,
} from '../types/tcgdexApi';
import type { PoolClient } from 'pg';

// ── Configuration ──────────────────────────────────────────

const TCGDEX_API_BASE = 'https://api.tcgdex.net/v2/en';
const DEFAULT_REQUEST_DELAY_MS = 100;

// ── Public types ───────────────────────────────────────────

export interface ImportOptions {
  setIds?: string[];
  dryRun?: boolean;
  force?: boolean;
  quick?: boolean; // Use set card summaries only (no individual card fetches)
  batchSize?: number;
  onProgress?: (event: ImportProgressEvent) => void;
}

export interface ImportProgressEvent {
  phase: 'sets' | 'cards';
  setId?: string;
  setName?: string;
  current: number;
  total: number;
  message: string;
}

export interface ImportResult {
  setsImported: number;
  setsSkipped: number;
  cardsImported: number;
  cardsSkipped: number;
  cardsUpdated: number;
  errors: Array<{ setId: string; cardId?: string; error: string }>;
  lookupTablesExtended: {
    rarities: string[];
    cardTypes: string[];
    energyTypes: string[];
  };
  duration: number;
}

// ── Rate limiter ───────────────────────────────────────────

class RateLimiter {
  private lastRequestTime = 0;
  private readonly minDelayMs: number;

  constructor(minDelayMs: number = DEFAULT_REQUEST_DELAY_MS) {
    this.minDelayMs = minDelayMs;
  }

  async throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minDelayMs) {
      await sleep(this.minDelayMs - elapsed);
    }
    this.lastRequestTime = Date.now();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── API client layer ───────────────────────────────────────

async function fetchWithRetry<T>(
  url: string,
  rateLimiter: RateLimiter,
  maxRetries: number = 3,
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    await rateLimiter.throttle();

    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('retry-after') || '5', 10);
        console.warn(`Rate limited. Waiting ${retryAfter}s...`);
        await sleep(retryAfter * 1000);
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return (await response.json()) as T;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      const delay = Math.pow(2, attempt) * 1000;
      console.warn(
        `Attempt ${attempt} failed: ${err instanceof Error ? err.message : err}. Retrying in ${delay}ms...`,
      );
      await sleep(delay);
    }
  }
  throw new Error('Unreachable');
}

async function fetchAllSets(rateLimiter: RateLimiter): Promise<TcgdexSetSummary[]> {
  const url = `${TCGDEX_API_BASE}/sets`;
  return fetchWithRetry<TcgdexSetSummary[]>(url, rateLimiter);
}

async function fetchSetDetail(setId: string, rateLimiter: RateLimiter): Promise<TcgdexSetDetail> {
  const url = `${TCGDEX_API_BASE}/sets/${setId}`;
  return fetchWithRetry<TcgdexSetDetail>(url, rateLimiter);
}

async function fetchCard(cardId: string, rateLimiter: RateLimiter): Promise<TcgdexCard> {
  const url = `${TCGDEX_API_BASE}/cards/${cardId}`;
  return fetchWithRetry<TcgdexCard>(url, rateLimiter);
}

// ── Lookup table resolution ────────────────────────────────

interface LookupCache {
  rarities: Map<string, number>;
  cardTypes: Map<string, number>;
  energyTypes: Map<string, number>;
}

async function loadLookupCache(client: PoolClient): Promise<LookupCache> {
  const [rarityRows, cardTypeRows, energyTypeRows] = await Promise.all([
    client.query<{ rarity_id: number; name: string }>('SELECT rarity_id, name FROM rarities'),
    client.query<{ card_type_id: number; name: string }>(
      'SELECT card_type_id, name FROM card_types',
    ),
    client.query<{ energy_type_id: number; name: string }>(
      'SELECT energy_type_id, name FROM energy_types',
    ),
  ]);

  return {
    rarities: new Map(rarityRows.rows.map((r) => [r.name, r.rarity_id])),
    cardTypes: new Map(cardTypeRows.rows.map((r) => [r.name, r.card_type_id])),
    energyTypes: new Map(energyTypeRows.rows.map((r) => [r.name, r.energy_type_id])),
  };
}

function generateCode(name: string): string {
  const words = name.split(/\s+/);
  if (words.length === 1) return name.substring(0, 3).toUpperCase();
  return words
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .substring(0, 10);
}

async function getOrCreateRarity(
  name: string,
  cache: LookupCache,
  client: PoolClient,
  newRarities: string[],
): Promise<number> {
  const cached = cache.rarities.get(name);
  if (cached !== undefined) return cached;

  const code = generateCode(name);
  await client.query(
    `INSERT INTO rarities (rarity_id, code, name, language_id, sort_order)
     VALUES (nextval('rarities_rarity_id_seq'), $1, $2, NULL, nextval('rarities_rarity_id_seq'))
     ON CONFLICT (name) DO NOTHING`,
    [code, name],
  );

  const result = await client.query<{ rarity_id: number }>(
    'SELECT rarity_id FROM rarities WHERE name = $1',
    [name],
  );

  const id = result.rows[0].rarity_id;
  cache.rarities.set(name, id);
  if (!newRarities.includes(name)) newRarities.push(name);
  return id;
}

function deriveCardTypeName(category: string): string {
  if (category === 'Pokemon') return 'Pokémon';
  if (category === 'Energy') return 'Energy';
  return 'Trainer';
}

async function getOrCreateCardType(
  category: string,
  cache: LookupCache,
  client: PoolClient,
  newCardTypes: string[],
): Promise<number> {
  const name = deriveCardTypeName(category);
  const cached = cache.cardTypes.get(name);
  if (cached !== undefined) return cached;

  await client.query(
    `INSERT INTO card_types (card_type_id, name)
     VALUES (nextval('card_types_card_type_id_seq'), $1)
     ON CONFLICT (name) DO NOTHING`,
    [name],
  );

  const result = await client.query<{ card_type_id: number }>(
    'SELECT card_type_id FROM card_types WHERE name = $1',
    [name],
  );

  const id = result.rows[0].card_type_id;
  cache.cardTypes.set(name, id);
  if (!newCardTypes.includes(name)) newCardTypes.push(name);
  return id;
}

async function getOrCreateEnergyType(
  typeName: string | undefined,
  cache: LookupCache,
  client: PoolClient,
  newEnergyTypes: string[],
): Promise<number> {
  const name = typeName || 'None';
  const cached = cache.energyTypes.get(name);
  if (cached !== undefined) return cached;

  await client.query(
    `INSERT INTO energy_types (energy_type_id, name)
     VALUES (nextval('energy_types_energy_type_id_seq'), $1)
     ON CONFLICT (name) DO NOTHING`,
    [name],
  );

  const result = await client.query<{ energy_type_id: number }>(
    'SELECT energy_type_id FROM energy_types WHERE name = $1',
    [name],
  );

  const id = result.rows[0].energy_type_id;
  cache.energyTypes.set(name, id);
  if (!newEnergyTypes.includes(name)) newEnergyTypes.push(name);
  return id;
}

// ── Data mapping helpers ───────────────────────────────────

function isSpecialPokemon(card: TcgdexCard): boolean {
  if (card.category !== 'Pokemon') return false;
  const specialStages = ['VMAX', 'VSTAR', 'V', 'GX', 'EX', 'MEGA'];
  if (card.stage && specialStages.includes(card.stage)) return true;
  if (card.name.endsWith(' ex') || card.name.endsWith(' EX')) return true;
  return false;
}

function isSecretRare(localId: string, officialCount: number): boolean {
  const num = parseInt(localId, 10);
  return !isNaN(num) && num > officialCount;
}

function isPromoCard(rarity?: string, setId?: string): boolean {
  if (rarity === 'Promo') return true;
  if (setId && setId.endsWith('p')) return true;
  return false;
}

function cardImageUrl(image?: string): string | null {
  if (!image) return null;
  return `${image}/high.webp`;
}

// ── Set upsert ─────────────────────────────────────────────

async function upsertSet(
  setDetail: TcgdexSetDetail,
  client: PoolClient,
  force: boolean,
): Promise<{ setId: number; action: 'imported' | 'updated' | 'skipped' }> {
  const existing = await client.query<{ set_id: number }>(
    'SELECT set_id FROM sets WHERE api_id = $1',
    [setDetail.id],
  );

  if (existing.rows.length > 0 && !force) {
    return { setId: existing.rows[0].set_id, action: 'skipped' };
  }

  if (existing.rows.length > 0) {
    await client.query(
      `UPDATE sets SET
        name = $1, total_cards = $2, total_with_sr = $3,
        image_symbol_url = $4, image_logo_url = $5,
        series = $6
       WHERE api_id = $7`,
      [
        setDetail.name,
        setDetail.cardCount.official,
        setDetail.cardCount.total,
        setDetail.symbol || null,
        setDetail.logo || null,
        setDetail.serie?.name || null,
        setDetail.id,
      ],
    );
    return { setId: existing.rows[0].set_id, action: 'updated' };
  }

  const result = await client.query<{ set_id: number }>(
    `INSERT INTO sets (set_code, name, series, language_id, release_date,
                       total_cards, total_with_sr, api_id,
                       image_symbol_url, image_logo_url)
     VALUES ($1, $2, $3, 1, $4, $5, $6, $7, $8, $9)
     RETURNING set_id`,
    [
      setDetail.id,
      setDetail.name,
      setDetail.serie?.name || null,
      setDetail.releaseDate || null,
      setDetail.cardCount.official,
      setDetail.cardCount.total,
      setDetail.id,
      setDetail.symbol || null,
      setDetail.logo || null,
    ],
  );

  return { setId: result.rows[0].set_id, action: 'imported' };
}

// ── Card upsert (full detail) ──────────────────────────────

async function upsertCardFull(
  card: TcgdexCard,
  setId: number,
  officialCount: number,
  cache: LookupCache,
  client: PoolClient,
  force: boolean,
  newLookups: ImportResult['lookupTablesExtended'],
): Promise<'imported' | 'updated' | 'skipped'> {
  const existingByApiId = await client.query<{ card_id: number }>(
    'SELECT card_id FROM cards WHERE api_id = $1',
    [card.id],
  );

  if (existingByApiId.rows.length > 0 && !force) {
    return 'skipped';
  }

  const cardTypeId = await getOrCreateCardType(card.category, cache, client, newLookups.cardTypes);
  const energyTypeId = await getOrCreateEnergyType(
    card.types?.[0],
    cache,
    client,
    newLookups.energyTypes,
  );

  const rarityName = card.rarity || 'Unknown';
  const rarityId = await getOrCreateRarity(rarityName, cache, client, newLookups.rarities);

  const pokedexNumber = card.dexId?.[0] ?? null;
  const isPokemonEx = isSpecialPokemon(card);
  const secretRare = isSecretRare(card.localId, officialCount);
  const promo = isPromoCard(card.rarity, card.set.id);
  const hasHoloVariant = card.variants?.holo === true || card.variants?.reverse === true;
  const imagePath = cardImageUrl(card.image);

  if (existingByApiId.rows.length > 0) {
    await client.query(
      `UPDATE cards SET
        name = $1, rarity_id = $2, image_path = $3,
        api_data = $4, imported_at = NOW(),
        card_type_id = $5, energy_type_id = $6,
        pokedex_number = $7, is_pokemon_ex = $8,
        is_secret_rare = $9, is_promo = $10,
        has_holo_variant = $11
       WHERE api_id = $12`,
      [
        card.name,
        rarityId,
        imagePath,
        JSON.stringify(card),
        cardTypeId,
        energyTypeId,
        pokedexNumber,
        isPokemonEx,
        secretRare,
        promo,
        hasHoloVariant,
        card.id,
      ],
    );
    return 'updated';
  }

  const existingByNumber = await client.query<{ card_id: number }>(
    `SELECT card_id FROM cards
     WHERE set_id = $1 AND card_number = $2 AND api_id IS NULL
     LIMIT 1`,
    [setId, card.localId],
  );

  if (existingByNumber.rows.length > 0) {
    await client.query(
      `UPDATE cards SET
        api_id = $1, image_path = $2, api_data = $3, imported_at = NOW()
       WHERE card_id = $4`,
      [card.id, imagePath, JSON.stringify(card), existingByNumber.rows[0].card_id],
    );
    return 'updated';
  }

  await client.query(
    `INSERT INTO cards (
       set_id, card_number, pokedex_number, name, card_type_id,
       energy_type_id, rarity_id, is_pokemon_ex, is_secret_rare,
       is_promo, has_holo_variant, image_path, api_id, api_data, imported_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())`,
    [
      setId,
      card.localId,
      pokedexNumber,
      card.name,
      cardTypeId,
      energyTypeId,
      rarityId,
      isPokemonEx,
      secretRare,
      promo,
      hasHoloVariant,
      imagePath,
      card.id,
      JSON.stringify(card),
    ],
  );

  return 'imported';
}

// ── Card upsert (quick mode — summary only) ────────────────

async function upsertCardQuick(
  cardSummary: TcgdexCardSummary,
  setId: number,
  officialCount: number,
  cache: LookupCache,
  client: PoolClient,
  force: boolean,
  newLookups: ImportResult['lookupTablesExtended'],
): Promise<'imported' | 'updated' | 'skipped'> {
  const existingByApiId = await client.query<{ card_id: number }>(
    'SELECT card_id FROM cards WHERE api_id = $1',
    [cardSummary.id],
  );

  if (existingByApiId.rows.length > 0 && !force) {
    return 'skipped';
  }

  const cardTypeId = cache.cardTypes.get('Pokémon') ?? 1;
  const energyTypeId = cache.energyTypes.get('None') ?? 11;
  const rarityId = await getOrCreateRarity('Unknown', cache, client, newLookups.rarities);

  const secretRare = isSecretRare(cardSummary.localId, officialCount);
  const imagePath = cardImageUrl(cardSummary.image);

  if (existingByApiId.rows.length > 0) {
    await client.query(
      `UPDATE cards SET
        name = $1, image_path = $2, imported_at = NOW()
       WHERE api_id = $3`,
      [cardSummary.name, imagePath, cardSummary.id],
    );
    return 'updated';
  }

  const existingByNumber = await client.query<{ card_id: number }>(
    `SELECT card_id FROM cards
     WHERE set_id = $1 AND card_number = $2 AND api_id IS NULL
     LIMIT 1`,
    [setId, cardSummary.localId],
  );

  if (existingByNumber.rows.length > 0) {
    await client.query(
      `UPDATE cards SET api_id = $1, image_path = $2, imported_at = NOW()
       WHERE card_id = $3`,
      [cardSummary.id, imagePath, existingByNumber.rows[0].card_id],
    );
    return 'updated';
  }

  await client.query(
    `INSERT INTO cards (
       set_id, card_number, name, card_type_id,
       energy_type_id, rarity_id, is_pokemon_ex, is_secret_rare,
       is_promo, has_holo_variant, image_path, api_id, imported_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
    [
      setId,
      cardSummary.localId,
      cardSummary.name,
      cardTypeId,
      energyTypeId,
      rarityId,
      false,
      secretRare,
      false,
      false,
      imagePath,
      cardSummary.id,
    ],
  );

  return 'imported';
}

// ── Main orchestrator ──────────────────────────────────────

export async function importFromApi(options: ImportOptions = {}): Promise<ImportResult> {
  const {
    setIds,
    dryRun = false,
    force = false,
    quick = false,
    batchSize = 50,
    onProgress,
  } = options;

  const startTime = Date.now();
  const rateLimiter = new RateLimiter();

  const result: ImportResult = {
    setsImported: 0,
    setsSkipped: 0,
    cardsImported: 0,
    cardsSkipped: 0,
    cardsUpdated: 0,
    errors: [],
    lookupTablesExtended: {
      rarities: [],
      cardTypes: [],
      energyTypes: [],
    },
    duration: 0,
  };

  // 1. Fetch all sets from TCGdex
  onProgress?.({
    phase: 'sets',
    current: 0,
    total: 0,
    message: 'Fetching sets from TCGdex...',
  });

  let apiSets = await fetchAllSets(rateLimiter);

  if (setIds && setIds.length > 0) {
    apiSets = apiSets.filter((s) => setIds.includes(s.id));
  }

  onProgress?.({
    phase: 'sets',
    current: 0,
    total: apiSets.length,
    message: `Found ${apiSets.length} sets to process`,
  });

  if (dryRun) {
    result.setsImported = apiSets.length;
    let totalCards = 0;
    for (const s of apiSets) {
      totalCards += s.cardCount.total;
    }
    result.cardsImported = totalCards;
    result.duration = Date.now() - startTime;
    return result;
  }

  // 2. Get a client and load lookup cache
  const pool = getPool();
  const client = await pool.connect();

  try {
    const cache = await loadLookupCache(client);

    // 3. Process each set
    for (let i = 0; i < apiSets.length; i++) {
      const apiSet = apiSets[i];

      onProgress?.({
        phase: 'sets',
        setId: apiSet.id,
        setName: apiSet.name,
        current: i + 1,
        total: apiSets.length,
        message: `Processing set: ${apiSet.name} (${apiSet.id})`,
      });

      try {
        // Fetch set detail for series, release date, and card list
        const setDetail = await fetchSetDetail(apiSet.id, rateLimiter);

        const setResult = await upsertSet(setDetail, client, force);

        if (setResult.action === 'skipped') {
          result.setsSkipped++;
          continue;
        }
        if (setResult.action === 'imported') result.setsImported++;
        if (setResult.action === 'updated') result.setsImported++;

        const cardSummaries = setDetail.cards || [];
        const officialCount = setDetail.cardCount.official;

        onProgress?.({
          phase: 'cards',
          setId: apiSet.id,
          setName: apiSet.name,
          current: 0,
          total: cardSummaries.length,
          message: `Importing ${cardSummaries.length} cards for ${apiSet.name}${quick ? ' (quick mode)' : ''}...`,
        });

        // Process cards in batches
        for (let j = 0; j < cardSummaries.length; j += batchSize) {
          const batch = cardSummaries.slice(j, j + batchSize);

          await client.query('BEGIN');
          try {
            for (const cardSummary of batch) {
              try {
                let action: 'imported' | 'updated' | 'skipped';

                if (quick) {
                  action = await upsertCardQuick(
                    cardSummary,
                    setResult.setId,
                    officialCount,
                    cache,
                    client,
                    force,
                    result.lookupTablesExtended,
                  );
                } else {
                  const fullCard = await fetchCard(cardSummary.id, rateLimiter);
                  action = await upsertCardFull(
                    fullCard,
                    setResult.setId,
                    officialCount,
                    cache,
                    client,
                    force,
                    result.lookupTablesExtended,
                  );
                }

                if (action === 'imported') result.cardsImported++;
                else if (action === 'updated') result.cardsUpdated++;
                else result.cardsSkipped++;
              } catch (err) {
                result.errors.push({
                  setId: apiSet.id,
                  cardId: cardSummary.id,
                  error: err instanceof Error ? err.message : String(err),
                });
              }
            }
            await client.query('COMMIT');
          } catch (err) {
            await client.query('ROLLBACK');
            result.errors.push({
              setId: apiSet.id,
              error: `Batch rollback: ${err instanceof Error ? err.message : String(err)}`,
            });
          }

          onProgress?.({
            phase: 'cards',
            setId: apiSet.id,
            setName: apiSet.name,
            current: Math.min(j + batchSize, cardSummaries.length),
            total: cardSummaries.length,
            message: `${apiSet.name}: ${Math.min(j + batchSize, cardSummaries.length)}/${cardSummaries.length} cards`,
          });
        }
      } catch (err) {
        result.errors.push({
          setId: apiSet.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } finally {
    client.release();
  }

  result.duration = Date.now() - startTime;
  return result;
}
