// Card from v_cards view (denormalized, read-only catalog)
export interface Card {
  card_id: number;
  set_code: string;
  set_name: string;
  language: string;
  card_number: string;
  pokedex_number: number | null;
  name: string;
  name_local: string | null;
  card_type: string;
  energy_type: string;
  rarity: string;
  is_pokemon_ex: boolean;
  is_secret_rare: boolean;
  is_promo: boolean;
  has_holo_variant: boolean;
  image_path: string | null;
}

// Card API response with computed image_url
export interface CardResponse extends Omit<Card, 'image_path'> {
  image_url: string | null;
}

// Set reference data
export interface CardSet {
  set_id: number;
  set_code: string;
  name: string;
  series: string | null;
  language: string;
  release_date: string | null;
  total_cards: number | null;
  total_with_sr: number | null;
}

// Collection entry from v_collection view (denormalized)
export interface CollectionEntry {
  collection_id: number;
  set_code: string;
  language: string;
  card_number: string;
  name: string;
  rarity: string;
  variant: string;
  quantity: number;
  condition: string;
  is_graded: boolean;
  grading_company: string | null;
  grade: number | null;
  date_acquired: string | null;
  purchase_price_usd: number | null;
  image_path: string | null;
}

// Collection entry API response with computed image_url
export interface CollectionEntryResponse extends Omit<CollectionEntry, 'image_path'> {
  image_url: string | null;
}

// Raw collection row (for inserts/updates)
export interface CollectionRow {
  collection_id: number;
  card_id: number;
  variant: string;
  quantity: number;
  condition: string;
  is_graded: boolean;
  grading_company: string | null;
  grade: number | null;
  date_acquired: string | null;
  purchase_price_usd: number | null;
  notes: string | null;
}

// Completion summary from v_completion_summary view
export interface CompletionSummary {
  set_code: string;
  set_name: string;
  language: string;
  total_cards: number;
  secret_rares: number;
  promos: number;
  holo_variant_eligible: number;
  owned_unique_cards: number;
  owned_total_variants: number;
  pct_complete: number;
}

// Input types
export interface AddToCollectionInput {
  card_id: number;
  variant?: string;
  quantity?: number;
  condition?: string;
  is_graded?: boolean;
  grading_company?: string;
  grade?: number;
  date_acquired?: string;
  purchase_price_usd?: number;
  notes?: string;
}

export interface UpdateCollectionInput {
  variant?: string;
  quantity?: number;
  condition?: string;
  is_graded?: boolean;
  grading_company?: string | null;
  grade?: number | null;
  date_acquired?: string | null;
  purchase_price_usd?: number | null;
  notes?: string | null;
}

// Card filters
export interface CardFilters {
  set_code?: string;
  language?: string;
  rarity?: string;
  card_type?: string;
  energy_type?: string;
  is_pokemon_ex?: boolean;
  is_secret_rare?: boolean;
  is_promo?: boolean;
  search?: string;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
