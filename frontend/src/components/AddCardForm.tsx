import { Component, createSignal } from 'solid-js';
import { api } from '../lib/api';

const variantOptions = ['Standard', 'Reverse Holo', 'Poke Ball Mirror', 'Master Ball Mirror', 'Cosmos Holo', 'Promo'] as const;
const conditionOptions = ['Mint', 'Near Mint', 'Lightly Played', 'Moderately Played', 'Heavily Played', 'Damaged'] as const;

interface AddCardFormProps {
  onAdded?: () => void;
}

const AddCardForm: Component<AddCardFormProps> = (props) => {
  const [isOpen, setIsOpen] = createSignal(false);
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [error, setError] = createSignal('');

  const [cardId, setCardId] = createSignal('');
  const [variant, setVariant] = createSignal<string>('Standard');
  const [quantity, setQuantity] = createSignal('1');
  const [condition, setCondition] = createSignal<string>('Near Mint');
  const [isGraded, setIsGraded] = createSignal(false);
  const [gradingCompany, setGradingCompany] = createSignal('');
  const [grade, setGrade] = createSignal('');
  const [dateAcquired, setDateAcquired] = createSignal('');
  const [purchasePrice, setPurchasePrice] = createSignal('');
  const [notes, setNotes] = createSignal('');

  const resetForm = () => {
    setCardId('');
    setVariant('Standard');
    setQuantity('1');
    setCondition('Near Mint');
    setIsGraded(false);
    setGradingCompany('');
    setGrade('');
    setDateAcquired('');
    setPurchasePrice('');
    setNotes('');
    setError('');
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const id = parseInt(cardId(), 10);
      if (isNaN(id) || id <= 0) {
        throw new Error('Card ID must be a positive number');
      }

      await api.collection.add({
        card_id: id,
        variant: variant(),
        quantity: parseInt(quantity(), 10) || 1,
        condition: condition(),
        is_graded: isGraded(),
        grading_company: isGraded() && gradingCompany() ? gradingCompany() : undefined,
        grade: isGraded() && grade() ? parseFloat(grade()) : undefined,
        date_acquired: dateAcquired() || undefined,
        purchase_price_usd: purchasePrice() ? parseFloat(purchasePrice()) : undefined,
        notes: notes() || undefined,
      });
      resetForm();
      setIsOpen(false);
      props.onAdded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to collection');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <button class="btn btn-primary" onClick={() => setIsOpen(!isOpen())} data-testid="add-card-toggle">
        {isOpen() ? 'Cancel' : '+ Add to Collection'}
      </button>

      {isOpen() && (
        <form
          onSubmit={handleSubmit}
          style={{
            background: 'var(--color-surface)',
            padding: '1.5rem',
            'border-radius': 'var(--radius-md)',
            'margin-top': '1rem',
            'box-shadow': 'var(--shadow-md)',
            border: '1px solid var(--color-border)',
          }}
          data-testid="add-card-form"
        >
          <h3 style={{ 'margin-bottom': '1rem', 'font-size': '1.1rem' }}>Add Card to Collection</h3>

          {error() && <div class="error-message">{error()}</div>}

          <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: '1rem' }}>
            <div class="form-group">
              <label>Card ID *</label>
              <input
                type="number"
                value={cardId()}
                onInput={(e) => setCardId(e.target.value)}
                required
                min="1"
                placeholder="e.g. 1"
                data-testid="card-id-input"
              />
            </div>
            <div class="form-group">
              <label>Variant</label>
              <select value={variant()} onChange={(e) => setVariant(e.target.value)}>
                {variantOptions.map((v) => (
                  <option value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div class="form-group">
              <label>Quantity</label>
              <input type="number" value={quantity()} onInput={(e) => setQuantity(e.target.value)} min="1" />
            </div>
            <div class="form-group">
              <label>Condition</label>
              <select value={condition()} onChange={(e) => setCondition(e.target.value)}>
                {conditionOptions.map((c) => (
                  <option value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div class="form-group">
              <label style={{ display: 'flex', 'align-items': 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={isGraded()}
                  onChange={(e) => setIsGraded(e.target.checked)}
                  style={{ width: 'auto' }}
                />
                Graded
              </label>
            </div>
            {isGraded() && (
              <>
                <div class="form-group">
                  <label>Grading Company</label>
                  <input type="text" value={gradingCompany()} onInput={(e) => setGradingCompany(e.target.value)} maxLength={10} placeholder="e.g. PSA" />
                </div>
                <div class="form-group">
                  <label>Grade</label>
                  <input type="number" value={grade()} onInput={(e) => setGrade(e.target.value)} min="0" max="10" step="0.5" />
                </div>
              </>
            )}
            <div class="form-group">
              <label>Date Acquired</label>
              <input type="date" value={dateAcquired()} onInput={(e) => setDateAcquired(e.target.value)} />
            </div>
            <div class="form-group">
              <label>Purchase Price ($)</label>
              <input type="number" value={purchasePrice()} onInput={(e) => setPurchasePrice(e.target.value)} min="0" step="0.01" />
            </div>
          </div>

          <div class="form-group">
            <label>Notes</label>
            <textarea
              value={notes()}
              onInput={(e) => setNotes(e.target.value)}
              rows="2"
              style={{ resize: 'vertical' }}
            />
          </div>

          <button
            type="submit"
            class="btn btn-primary"
            disabled={isSubmitting()}
            data-testid="submit-card-btn"
          >
            {isSubmitting() ? 'Adding...' : 'Add to Collection'}
          </button>
        </form>
      )}
    </div>
  );
};

export default AddCardForm;
