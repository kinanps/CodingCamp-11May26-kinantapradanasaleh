/**
 * Unit tests for handleFormSubmit() (Task 8.2)
 * Requirements: 1.2, 1.3, 1.4, 1.5
 */

import {
  handleFormSubmit,
  getTransactions,
  setTransactions,
} from '../app.js';

// ─── DOM setup ───────────────────────────────────────────────────────────────

beforeEach(() => {
  // Reset in-memory state
  setTransactions([]);
  localStorage.clear();

  // Set up a minimal DOM with the form and all required fields
  document.body.innerHTML = `
    <form id="transaction-form" novalidate>
      <input id="item-name" type="text" value="" />
      <span class="error" id="error-item-name"></span>
      <input id="amount" type="number" value="" />
      <span class="error" id="error-amount"></span>
      <select id="category">
        <option value="Food">Food</option>
        <option value="Transport">Transport</option>
        <option value="Fun">Fun</option>
      </select>
      <span class="error" id="error-category"></span>
      <button type="submit">Add Transaction</button>
    </form>
    <div id="toast-container"></div>
    <span id="balance-amount">$0.00</span>
    <ul id="transaction-list"></ul>
  `;
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Creates a synthetic submit event targeting the form element.
 * Includes a jest.fn() for preventDefault so we can assert it was called.
 */
function makeSubmitEvent(formEl) {
  const event = new Event('submit', { bubbles: true, cancelable: true });
  // Override target to point at the form (jsdom sets it automatically when
  // dispatched, but we also need reset() to be callable)
  Object.defineProperty(event, 'target', { value: formEl, writable: false });
  event.preventDefault = jest.fn();
  return event;
}

function getForm() {
  return document.getElementById('transaction-form');
}

function setFieldValues({ itemName = '', amount = '', category = 'Food' } = {}) {
  document.getElementById('item-name').value = itemName;
  document.getElementById('amount').value    = amount;
  document.getElementById('category').value  = category;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('handleFormSubmit — always calls preventDefault', () => {
  test('calls event.preventDefault() on a valid submission', () => {
    setFieldValues({ itemName: 'Lunch', amount: '12.50', category: 'Food' });
    const event = makeSubmitEvent(getForm());

    handleFormSubmit(event);

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  test('calls event.preventDefault() on an invalid submission', () => {
    setFieldValues({ itemName: '', amount: '', category: 'Food' });
    const event = makeSubmitEvent(getForm());

    handleFormSubmit(event);

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });
});

describe('handleFormSubmit — valid submission', () => {
  test('calls addTransaction and grows the transaction list by 1', () => {
    setFieldValues({ itemName: 'Coffee', amount: '3.50', category: 'Food' });
    const event = makeSubmitEvent(getForm());

    handleFormSubmit(event);

    expect(getTransactions()).toHaveLength(1);
  });

  test('added transaction has the correct itemName (trimmed)', () => {
    setFieldValues({ itemName: '  Lunch  ', amount: '12.50', category: 'Food' });
    const event = makeSubmitEvent(getForm());

    handleFormSubmit(event);

    expect(getTransactions()[0].itemName).toBe('Lunch');
  });

  test('added transaction has the correct amount as a number', () => {
    setFieldValues({ itemName: 'Bus', amount: '2.50', category: 'Transport' });
    const event = makeSubmitEvent(getForm());

    handleFormSubmit(event);

    expect(getTransactions()[0].amount).toBe(2.5);
  });

  test('added transaction has the correct category', () => {
    setFieldValues({ itemName: 'Movie', amount: '15.00', category: 'Fun' });
    const event = makeSubmitEvent(getForm());

    handleFormSubmit(event);

    expect(getTransactions()[0].category).toBe('Fun');
  });

  test('resets the form fields after successful submission', () => {
    setFieldValues({ itemName: 'Lunch', amount: '12.50', category: 'Transport' });
    const form = getForm();
    const event = makeSubmitEvent(form);

    // Spy on form.reset to confirm it is called
    const resetSpy = jest.spyOn(form, 'reset');

    handleFormSubmit(event);

    expect(resetSpy).toHaveBeenCalledTimes(1);
  });

  test('does NOT call showValidationErrors on a valid submission', () => {
    setFieldValues({ itemName: 'Lunch', amount: '12.50', category: 'Food' });
    const event = makeSubmitEvent(getForm());

    handleFormSubmit(event);

    // Error spans should remain empty
    expect(document.getElementById('error-item-name').textContent).toBe('');
    expect(document.getElementById('error-amount').textContent).toBe('');
    expect(document.getElementById('error-category').textContent).toBe('');
  });
});

describe('handleFormSubmit — invalid submission', () => {
  test('does NOT call addTransaction when itemName is empty', () => {
    setFieldValues({ itemName: '', amount: '12.50', category: 'Food' });
    const event = makeSubmitEvent(getForm());

    handleFormSubmit(event);

    expect(getTransactions()).toHaveLength(0);
  });

  test('does NOT call addTransaction when amount is invalid', () => {
    setFieldValues({ itemName: 'Lunch', amount: '-5', category: 'Food' });
    const event = makeSubmitEvent(getForm());

    handleFormSubmit(event);

    expect(getTransactions()).toHaveLength(0);
  });

  test('does NOT call addTransaction when amount is zero', () => {
    setFieldValues({ itemName: 'Lunch', amount: '0', category: 'Food' });
    const event = makeSubmitEvent(getForm());

    handleFormSubmit(event);

    expect(getTransactions()).toHaveLength(0);
  });

  test('does NOT reset the form on an invalid submission', () => {
    setFieldValues({ itemName: '', amount: '12.50', category: 'Food' });
    const form = getForm();
    const event = makeSubmitEvent(form);
    const resetSpy = jest.spyOn(form, 'reset');

    handleFormSubmit(event);

    expect(resetSpy).not.toHaveBeenCalled();
  });

  test('calls showValidationErrors — populates #error-item-name when itemName is empty', () => {
    setFieldValues({ itemName: '', amount: '12.50', category: 'Food' });
    const event = makeSubmitEvent(getForm());

    handleFormSubmit(event);

    expect(document.getElementById('error-item-name').textContent).not.toBe('');
  });

  test('calls showValidationErrors — populates #error-amount when amount is invalid', () => {
    setFieldValues({ itemName: 'Lunch', amount: 'abc', category: 'Food' });
    const event = makeSubmitEvent(getForm());

    handleFormSubmit(event);

    expect(document.getElementById('error-amount').textContent).not.toBe('');
  });

  test('populates multiple error spans when multiple fields are invalid', () => {
    setFieldValues({ itemName: '', amount: '', category: 'Food' });
    const event = makeSubmitEvent(getForm());

    handleFormSubmit(event);

    expect(document.getElementById('error-item-name').textContent).not.toBe('');
    expect(document.getElementById('error-amount').textContent).not.toBe('');
  });
});

describe('handleFormSubmit — clears previous validation errors before validating', () => {
  test('clears stale error messages before running validation', () => {
    // Pre-populate error spans to simulate a previous failed submission
    document.getElementById('error-item-name').textContent = 'Old error';
    document.getElementById('error-amount').textContent    = 'Old error';

    // Now submit with valid data — errors should be cleared
    setFieldValues({ itemName: 'Lunch', amount: '12.50', category: 'Food' });
    const event = makeSubmitEvent(getForm());

    handleFormSubmit(event);

    expect(document.getElementById('error-item-name').textContent).toBe('');
    expect(document.getElementById('error-amount').textContent).toBe('');
  });

  test('clears stale errors even when the new submission is also invalid', () => {
    // Pre-populate error spans
    document.getElementById('error-amount').textContent = 'Old amount error';

    // Submit with a different invalid field — old error should be cleared first
    setFieldValues({ itemName: '', amount: '12.50', category: 'Food' });
    const event = makeSubmitEvent(getForm());

    handleFormSubmit(event);

    // The old amount error should be gone (clearValidationErrors was called)
    // A new itemName error should be present
    expect(document.getElementById('error-item-name').textContent).not.toBe('');
    // amount error should be cleared (no amount error this time)
    expect(document.getElementById('error-amount').textContent).toBe('');
  });
});
