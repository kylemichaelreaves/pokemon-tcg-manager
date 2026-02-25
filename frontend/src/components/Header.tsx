import type { Component } from 'solid-js';

const Header: Component = () => {
  return (
    <header
      style={{
        'background-color': 'var(--color-secondary-dark)',
        color: 'white',
        padding: '1rem 0',
        'box-shadow': 'var(--shadow-md)',
      }}
    >
      <div class="container" style={{ display: 'flex', 'align-items': 'center', gap: '1rem' }}>
        <h1 style={{ 'font-size': '1.5rem', 'font-weight': '700' }}>
          ⚡ Pokémon TCG Manager
        </h1>
        <nav style={{ display: 'flex', gap: '1rem', 'margin-left': 'auto' }}>
          <a
            href="/"
            style={{ color: 'rgba(255,255,255,0.9)', 'text-decoration': 'none', 'font-weight': '500' }}
          >
            Cards
          </a>
          <a
            href="/collection"
            style={{ color: 'rgba(255,255,255,0.9)', 'text-decoration': 'none', 'font-weight': '500' }}
          >
            Collection
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
