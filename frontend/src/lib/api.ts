import type {
  Card,
  CardSet,
  CollectionEntry,
  CompletionSummary,
  AddToCollectionInput,
  UpdateCollectionInput,
  CardFilters,
  PaginatedResponse,
  ApiResponse,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const json: ApiResponse<T> = await response.json();

  if (!json.success || !response.ok) {
    throw new Error(json.error || `Request failed: ${response.status}`);
  }

  return json.data as T;
}

export const api = {
  cards: {
    list(params?: {
      page?: number;
      limit?: number;
      sort_by?: string;
      sort_order?: 'asc' | 'desc';
      filters?: CardFilters;
    }): Promise<PaginatedResponse<Card>> {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.sort_by) searchParams.set('sort_by', params.sort_by);
      if (params?.sort_order) searchParams.set('sort_order', params.sort_order);
      if (params?.filters) {
        const f = params.filters;
        if (f.set_code) searchParams.set('set_code', f.set_code);
        if (f.language) searchParams.set('language', f.language);
        if (f.rarity) searchParams.set('rarity', f.rarity);
        if (f.card_type) searchParams.set('card_type', f.card_type);
        if (f.energy_type) searchParams.set('energy_type', f.energy_type);
        if (f.is_pokemon_ex !== undefined)
          searchParams.set('is_pokemon_ex', String(f.is_pokemon_ex));
        if (f.is_secret_rare !== undefined)
          searchParams.set('is_secret_rare', String(f.is_secret_rare));
        if (f.is_promo !== undefined) searchParams.set('is_promo', String(f.is_promo));
        if (f.search) searchParams.set('search', f.search);
      }
      const qs = searchParams.toString();
      return request<PaginatedResponse<Card>>(`/cards${qs ? `?${qs}` : ''}`);
    },

    get(id: number): Promise<Card> {
      return request<Card>(`/cards/${id}`);
    },
  },

  sets: {
    list(): Promise<CardSet[]> {
      return request<CardSet[]>('/sets');
    },
  },

  collection: {
    list(): Promise<CollectionEntry[]> {
      return request<CollectionEntry[]>('/collection');
    },

    get(id: number): Promise<CollectionEntry> {
      return request<CollectionEntry>(`/collection/${id}`);
    },

    add(input: AddToCollectionInput): Promise<CollectionEntry> {
      return request<CollectionEntry>('/collection', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    update(id: number, input: UpdateCollectionInput): Promise<CollectionEntry> {
      return request<CollectionEntry>(`/collection/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
    },

    remove(id: number): Promise<void> {
      return request<void>(`/collection/${id}`, { method: 'DELETE' });
    },

    summary(): Promise<CompletionSummary[]> {
      return request<CompletionSummary[]>('/collection/summary');
    },
  },

  health(): Promise<{ status: string; timestamp: string; database: string }> {
    return request('/health');
  },
};
