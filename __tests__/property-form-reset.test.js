/**
 * Property-based test for form reset after successful submission (Task 8.3)
 *
 * Property 8: Form reset after successful submission
 * Validates: Requirements 1.5
 *
 * For any valid form submission that results in a transaction being added,
 * the form's item name field, amount field, and category selector SHALL be
 * reset to their initial/empty state immediately after the transaction is added.
 */

import fc from 'fast-check';
import { handleFormSubmit, setTransactions } from '../js/app.js';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * Generates a non-empty string, trimmed, with length between 1 and 100 chars.
 */
const validItemNameArbitrary = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => s.trim().length > 0 && s.trim().length <= 100);

/**
 * Generates a string representation of a positive float that satisfies:
 *  - value > 0
 *  - value ≤ 999,999,999.99
 *  - at most 2 decimal places
 */
const validAmountArbitrary = fc
  .record({
    intPart: fc.integer({ min: 0, max: 999_999_999 }),
    centPart: fc.integer({ min: 0, max: 99 }),
  })
  .map(({ intPart, centPart }) => {
    const totalCents = intPart * 100 + centPart;
    if (totalCents === 0) {
      return '0.01';
    }
    const dollars = Math.floor(totalCents / 100);
    const cents = totalCents % 100;
    return cents === 0
      ? String(dollars)
      : `${dollars}.${String(cents).padStart(2, '0')}`;
  })
  .filter((s) => {
    const v = parseFloat(s);
    return v > 0 && v <= 999_999_999.99;
  });

/**
 * Generates one of the three valid categories.
 */
const validCategoryArbitrary = fc.constantFrom('Food', 'Transport', 'Fun');

/**
 * Combines all three valid field arbitraries into a single record.
 * Matches the `validTransactionFields` shape described in the design doc.
 */
const validTransactionFields = fc.record({
  itemName: validItemNameArbitrary,
  amount: validAmountArbitrary,
  category: validCategoryArbitrary,
});

// ---------------------------------------------------------------------------
// DOM setup helpers
// ---------------------------------------------------------------------------

/**
 * Sets up a minimal DOM with all elements required by handleFormSubmit,
 * addTransaction, renderBalance, renderList, and renderChart.
 */
function setupDOM() {
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
}

/**
 * Creates a synthetic submit event targeting the form element.
 * Includes a jest.fn() for preventDefault.
 */
function makeSubmitEvent(formEl) {
  const event = new Event('submit', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'target', { value: formEl, writable: false });
  event.preventDefault = jest.fn();
  return event;
}

// ---------------------------------------------------------------------------
// Property test
// ---------------------------------------------------------------------------

describe('Property 8 — Form reset after successful submission', () => {
  beforeEach(() => {
    setTransactions([]);
    localStorage.clear();
    setupDOM();
  });

  /**
   * For any valid combination of itemName, amount, and category,
   * after handleFormSubmit succeeds the form fields SHALL be reset
   * to their initial/empty state:
   *   - #item-name value === ''
   *   - #amount value === ''
   *   - #category value === 'Food' (first option, the default after reset)
   *
   * Validates: Requirements 1.5
   */
  test(
    'form fields are reset to initial state after any valid submission',
    () => {
      fc.assert(
        fc.property(validTransactionFields, ({ itemName, amount, category }) => {
          // Reset DOM and state for each generated example
          setTransactions([]);
          localStorage.clear();
          setupDOM();

          // Set the field values to the generated inputs
          document.getElementById('item-name').value = itemName;
          document.getElementById('amount').value    = amount;
          document.getElementById('category').value  = category;

          const form  = document.getElementById('transaction-form');
          const event = makeSubmitEvent(form);

          handleFormSubmit(event);

          // Assert fields are reset to initial/empty state
          const itemNameEl = document.getElementById('item-name');
          const amountEl   = document.getElementById('amount');
          const categoryEl = document.getElementById('category');

          return (
            itemNameEl.value === '' &&
            amountEl.value   === '' &&
            categoryEl.value === 'Food'
          );
        }),
        { numRuns: 100 }
      );
    }
  );
});
