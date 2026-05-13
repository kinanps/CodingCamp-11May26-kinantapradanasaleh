/**
 * Property-based test for balance rendering (Task 7.2)
 *
 * Property 3: Balance equals sum of all transaction amounts
 * Validates: Requirements 3.2, 3.3, 3.4
 *
 * For any transaction list (including the empty list), the value rendered by
 * renderBalance() SHALL equal the arithmetic sum of all `amount` fields in the
 * list, formatted to exactly 2 decimal places with a `$` prefix.
 */

import fc from 'fast-check';
import {
  renderBalance,
  setTransactions,
  CATEGORIES,
} from '../app.js';

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  setTransactions([]);

  // Ensure a minimal DOM with the #balance-amount element exists
  document.body.innerHTML = '<span id="balance-amount"></span>';
});

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * Generates a valid amount: positive float > 0, ≤ 999,999,999.99, ≤ 2 decimal places.
 * We generate an integer number of cents (1 to 99_999_999_999) and divide by 100
 * to guarantee exactly ≤ 2 decimal places and stay within the allowed range.
 */
const validAmountArbitrary = fc
  .integer({ min: 1, max: 99_999_999_999 })
  .map((cents) => Math.round(cents) / 100);

/**
 * Generates a valid itemName: non-empty, trimmed, ≤ 100 chars.
 */
const validItemNameArbitrary = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => s.trim().length > 0 && s.trim() === s);

/**
 * Generates a valid Transaction object matching the Transaction schema.
 */
const validTransactionArbitrary = fc.record({
  id: fc.uuid(),
  itemName: validItemNameArbitrary,
  amount: validAmountArbitrary,
  category: fc.constantFrom(...CATEGORIES),
  createdAt: fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }),
});

// ---------------------------------------------------------------------------
// Property 3: Balance equals sum of all transaction amounts
// ---------------------------------------------------------------------------

/**
 * **Validates: Requirements 3.2, 3.3, 3.4**
 *
 * For any array of valid Transaction objects (including the empty array),
 * calling renderBalance() SHALL update #balance-amount textContent to equal
 * '$' + sum.toFixed(2) where sum is the arithmetic sum of all transaction.amount values.
 */
describe('Property 3: Balance equals sum of all transaction amounts', () => {
  test('renderBalance sets #balance-amount to the correct formatted sum for any transaction array', () => {
    fc.assert(
      fc.property(
        fc.array(validTransactionArbitrary, { minLength: 0, maxLength: 100 }),
        (transactions) => {
          // 1. Set the in-memory state to the generated array
          setTransactions(transactions);

          // 2. Compute the expected sum
          const sum = transactions.reduce((acc, t) => acc + t.amount, 0);
          const expected = '$' + sum.toFixed(2);

          // 3. Call renderBalance()
          renderBalance();

          // 4. Assert the DOM element shows the correct formatted balance
          const el = document.getElementById('balance-amount');
          expect(el.textContent).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });
});
