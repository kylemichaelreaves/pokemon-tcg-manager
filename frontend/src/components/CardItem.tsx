import type { Component } from 'solid-js';
import { Show } from 'solid-js';
import type { Card } from '../types';

interface CardItemProps {
  card: Card;
}

function badgeClass(value: string, prefix: string): string {
  return `badge badge-${prefix}-${value.toLowerCase().replace(/\s+/g, '_')}`;
}

const CardItem: Component<CardItemProps> = (props) => {
  return (
    <div class="card-item" data-testid="card-item">
      <div class="card-image-wrapper">
        <Show
          when={props.card.image_url}
          fallback={
            <div class="card-image-placeholder">
              <span>No Image</span>
            </div>
          }
        >
          <img
            src={props.card.image_url!}
            alt={props.card.name}
            class="card-image"
            loading="lazy"
          />
        </Show>
      </div>

      <div
        style={{
          display: 'flex',
          'justify-content': 'space-between',
          'align-items': 'flex-start',
          'margin-top': '0.75rem',
          'margin-bottom': '0.5rem',
        }}
      >
        <h3 style={{ 'font-size': '1.1rem', 'font-weight': '600' }}>{props.card.name}</h3>
        <Show when={props.card.energy_type}>
          <span class={`badge badge-${props.card.energy_type.toLowerCase()}`}>
            {props.card.energy_type}
          </span>
        </Show>
      </div>

      <div
        style={{ display: 'flex', gap: '0.5rem', 'flex-wrap': 'wrap', 'margin-bottom': '0.75rem' }}
      >
        <span class={badgeClass(props.card.rarity, 'rarity')}>{props.card.rarity}</span>
        <span class="badge" style={{ background: '#f3f4f6', color: '#4b5563' }}>
          {props.card.card_type}
        </span>
        <Show when={props.card.is_pokemon_ex}>
          <span class="badge badge-ex">EX</span>
        </Show>
        <Show when={props.card.is_secret_rare}>
          <span class="badge badge-secret">Secret</span>
        </Show>
        <Show when={props.card.is_promo}>
          <span class="badge badge-promo-flag">Promo</span>
        </Show>
      </div>

      <div style={{ 'font-size': '0.85rem', color: 'var(--color-text-muted)' }}>
        <div>
          {props.card.set_name} · #{props.card.card_number}
        </div>
        <div>{props.card.language}</div>
        <Show when={props.card.pokedex_number}>
          <div>Pokedex #{props.card.pokedex_number}</div>
        </Show>
      </div>
    </div>
  );
};

export default CardItem;
