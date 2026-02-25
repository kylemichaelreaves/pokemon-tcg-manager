import type { Component } from 'solid-js';
import Header from './components/Header';
import CardList from './components/CardList';
import AddCardForm from './components/AddCardForm';
import './styles/global.css';

const App: Component = () => {
  return (
    <div>
      <Header />
      <main class="container" style={{ 'padding-top': '2rem', 'padding-bottom': '2rem' }}>
        <div
          style={{
            display: 'flex',
            'justify-content': 'space-between',
            'align-items': 'center',
            'margin-bottom': '1.5rem',
          }}
        >
          <h2 style={{ 'font-size': '1.5rem' }}>Card Catalog</h2>
        </div>
        <AddCardForm />
        <div style={{ 'margin-top': '1.5rem' }}>
          <CardList />
        </div>
      </main>
    </div>
  );
};

export default App;
