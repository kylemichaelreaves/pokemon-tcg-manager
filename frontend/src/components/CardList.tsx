import type { Component } from 'solid-js';
import { For, Show, Switch, Match } from 'solid-js';
import CardItem from './CardItem';
import {
  cards,
  currentPage,
  setCurrentPage,
  filters,
  updateFilter,
  clearFilters,
} from '../stores/cardStore';

const CardList: Component = () => {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          'flex-wrap': 'wrap',
          'align-items': 'flex-end',
          'margin-bottom': '1rem',
          padding: '1rem',
          background: 'var(--color-surface)',
          'border-radius': 'var(--radius-md)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div class="form-group" style={{ 'margin-bottom': '0', flex: '1', 'min-width': '180px' }}>
          <label>Search</label>
          <input
            type="text"
            placeholder="Search by name..."
            value={filters().search || ''}
            onInput={(e) => updateFilter('search', e.target.value || undefined)}
            data-testid="search-input"
          />
        </div>

        <div class="form-group" style={{ 'margin-bottom': '0', 'min-width': '120px' }}>
          <label>Set</label>
          <input
            type="text"
            placeholder="e.g. MEW"
            value={filters().set_code || ''}
            onInput={(e) => updateFilter('set_code', e.target.value || undefined)}
          />
        </div>

        <div class="form-group" style={{ 'margin-bottom': '0', 'min-width': '100px' }}>
          <label>Language</label>
          <select
            value={filters().language || ''}
            onChange={(e) => updateFilter('language', e.target.value || undefined)}
          >
            <option value="">All</option>
            <option value="EN">EN</option>
            <option value="JP">JP</option>
          </select>
        </div>

        <div class="form-group" style={{ 'margin-bottom': '0', 'min-width': '120px' }}>
          <label>Card Type</label>
          <input
            type="text"
            placeholder="e.g. Pokemon"
            value={filters().card_type || ''}
            onInput={(e) => updateFilter('card_type', e.target.value || undefined)}
          />
        </div>

        <div class="form-group" style={{ 'margin-bottom': '0', 'min-width': '120px' }}>
          <label>Energy</label>
          <input
            type="text"
            placeholder="e.g. Fire"
            value={filters().energy_type || ''}
            onInput={(e) => updateFilter('energy_type', e.target.value || undefined)}
          />
        </div>

        <button
          class="btn btn-secondary"
          style={{ 'align-self': 'flex-end' }}
          onClick={clearFilters}
        >
          Clear Filters
        </button>
      </div>

      <Switch>
        <Match when={cards.loading}>
          <div class="loading">Loading cards...</div>
        </Match>
        <Match when={cards.error}>
          <div class="error-message">Failed to load cards: {(cards.error as Error).message}</div>
        </Match>
        <Match when={cards()}>
          <Show
            when={cards()!.data.length > 0}
            fallback={
              <div class="loading" style={{ 'flex-direction': 'column', gap: '0.5rem' }}>
                <span style={{ 'font-size': '2rem' }}>🃏</span>
                <span>No cards match your filters.</span>
              </div>
            }
          >
            <div
              style={{
                'font-size': '0.85rem',
                color: 'var(--color-text-muted)',
                'margin-bottom': '0.5rem',
              }}
            >
              {cards()!.total} cards found
            </div>

            <div class="card-grid">
              <For each={cards()!.data}>{(card) => <CardItem card={card} />}</For>
            </div>

            <Show when={cards()!.total_pages > 1}>
              <div class="pagination">
                <button
                  class="btn btn-secondary"
                  disabled={currentPage() <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  Previous
                </button>
                <span>
                  Page {currentPage()} of {cards()!.total_pages}
                </span>
                <button
                  class="btn btn-secondary"
                  disabled={currentPage() >= cards()!.total_pages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </Show>
          </Show>
        </Match>
      </Switch>
    </div>
  );
};

export default CardList;
