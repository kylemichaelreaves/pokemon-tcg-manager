import { describe, it, expect } from 'vitest';
import { render, screen } from '@solidjs/testing-library';
import CardItem from '../../components/CardItem';
import type { Card } from '../../types';

const mockCard: Card = {
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
};

describe('CardItem', () => {
  it('renders the card name', () => {
    render(() => <CardItem card={mockCard} />);
    expect(screen.getByText('Charizard')).toBeInTheDocument();
  });

  it('renders the energy type badge', () => {
    render(() => <CardItem card={mockCard} />);
    expect(screen.getByText('Fire')).toBeInTheDocument();
  });

  it('renders the rarity badge', () => {
    render(() => <CardItem card={mockCard} />);
    expect(screen.getByText('Rare')).toBeInTheDocument();
  });

  it('renders the set info', () => {
    render(() => <CardItem card={mockCard} />);
    expect(screen.getByText('Pokemon 151 · #006/165')).toBeInTheDocument();
  });

  it('renders the language', () => {
    render(() => <CardItem card={mockCard} />);
    expect(screen.getByText('EN')).toBeInTheDocument();
  });

  it('renders pokedex number when present', () => {
    render(() => <CardItem card={mockCard} />);
    expect(screen.getByText('Pokedex #6')).toBeInTheDocument();
  });

  it('does not render pokedex number when null', () => {
    const trainerCard = { ...mockCard, pokedex_number: null, card_type: 'Trainer', energy_type: '' };
    render(() => <CardItem card={trainerCard} />);
    expect(screen.queryByText(/Pokedex/)).not.toBeInTheDocument();
  });

  it('renders EX badge when is_pokemon_ex is true', () => {
    const exCard = { ...mockCard, is_pokemon_ex: true };
    render(() => <CardItem card={exCard} />);
    expect(screen.getByText('EX')).toBeInTheDocument();
  });

  it('does not render EX badge when is_pokemon_ex is false', () => {
    render(() => <CardItem card={mockCard} />);
    expect(screen.queryByText('EX')).not.toBeInTheDocument();
  });

  it('renders Secret badge when is_secret_rare is true', () => {
    const secretCard = { ...mockCard, is_secret_rare: true };
    render(() => <CardItem card={secretCard} />);
    expect(screen.getByText('Secret')).toBeInTheDocument();
  });

  it('renders Promo badge when is_promo is true', () => {
    const promoCard = { ...mockCard, is_promo: true };
    render(() => <CardItem card={promoCard} />);
    expect(screen.getByText('Promo')).toBeInTheDocument();
  });

  it('renders card type badge', () => {
    render(() => <CardItem card={mockCard} />);
    expect(screen.getByText('Pokemon')).toBeInTheDocument();
  });
});
