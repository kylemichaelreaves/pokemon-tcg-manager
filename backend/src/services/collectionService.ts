import { query, queryOne } from '../utils/db';
import {
  CollectionEntry,
  CollectionEntryResponse,
  CollectionRow,
  AddToCollectionInput,
  UpdateCollectionInput,
  CompletionSummary,
} from '../types';
import { toImageUrl } from '../utils/imageUrl';

function toCollectionEntryResponse(entry: CollectionEntry): CollectionEntryResponse {
  const { image_path, ...rest } = entry;
  return { ...rest, image_url: toImageUrl(image_path) };
}

export async function getCollection(): Promise<CollectionEntryResponse[]> {
  const entries = await query<CollectionEntry>('SELECT * FROM v_collection');
  return entries.map(toCollectionEntryResponse);
}

export async function getCollectionEntryById(id: number): Promise<CollectionEntryResponse | null> {
  const entry = await queryOne<CollectionEntry>(
    'SELECT * FROM v_collection WHERE collection_id = $1',
    [id],
  );
  return entry ? toCollectionEntryResponse(entry) : null;
}

export async function addToCollection(input: AddToCollectionInput): Promise<CollectionRow> {
  const result = await queryOne<CollectionRow>(
    `INSERT INTO collection
       (card_id, variant, quantity, condition, is_graded, grading_company, grade, date_acquired, purchase_price_usd, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      input.card_id,
      input.variant || 'Standard',
      input.quantity ?? 1,
      input.condition || 'Near Mint',
      input.is_graded || false,
      input.grading_company || null,
      input.grade ?? null,
      input.date_acquired || null,
      input.purchase_price_usd ?? null,
      input.notes || null,
    ],
  );

  if (!result) throw new Error('Failed to add to collection');
  return result;
}

export async function updateCollectionEntry(
  id: number,
  input: UpdateCollectionInput,
): Promise<CollectionRow | null> {
  const fields: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      fields.push(`${key} = $${paramIndex++}`);
      params.push(value);
    }
  }

  if (fields.length === 0) return null;

  params.push(id);
  return queryOne<CollectionRow>(
    `UPDATE collection SET ${fields.join(', ')} WHERE collection_id = $${paramIndex} RETURNING *`,
    params,
  );
}

export async function removeFromCollection(id: number): Promise<boolean> {
  const result = await queryOne<{ collection_id: number }>(
    'DELETE FROM collection WHERE collection_id = $1 RETURNING collection_id',
    [id],
  );
  return result !== null;
}

export async function getCompletionSummary(): Promise<CompletionSummary[]> {
  return query<CompletionSummary>('SELECT * FROM v_completion_summary');
}
