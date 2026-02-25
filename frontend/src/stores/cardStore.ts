import { createSignal, createResource } from 'solid-js';
import { api } from '../lib/api';
import type { CardFilters } from '../types';

const [currentPage, setCurrentPage] = createSignal(1);
const [sortBy, setSortBy] = createSignal<string>('name');
const [sortOrder, setSortOrder] = createSignal<'asc' | 'desc'>('asc');
const [filters, setFilters] = createSignal<CardFilters>({});
const [refetchTrigger, setRefetchTrigger] = createSignal(0);

function fetchParams() {
  refetchTrigger();
  return {
    page: currentPage(),
    limit: 20,
    sort_by: sortBy(),
    sort_order: sortOrder(),
    filters: filters(),
  };
}

const [cards, { refetch: refetchCards }] = createResource(fetchParams, (params) =>
  api.cards.list(params),
);

function updateFilter<K extends keyof CardFilters>(key: K, value: CardFilters[K]) {
  setFilters((prev) => {
    const next = { ...prev };
    if (value === undefined || value === '') {
      delete next[key];
    } else {
      next[key] = value;
    }
    return next;
  });
  setCurrentPage(1);
}

function clearFilters() {
  setFilters({});
  setCurrentPage(1);
}

export {
  cards,
  refetchCards,
  currentPage,
  setCurrentPage,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  filters,
  updateFilter,
  clearFilters,
};
