/**
 * Property-based tests for localStorage persistence (Task 3.2)
 *
 * Property 5: LocalStorage round-trip preserves all valid transactions
 * Validates: Requirements 5.1, 5.2, 5.3
 */

import fc from 'fast-check';
import {
  saveToStorage,
  loadFromStorage,
  setTransactions,
  CATEGORIES,
} from '../js/app.js';

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  setTransactions([]);
  localStorage.clear();
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
 * We use printable ASCII characters and ensure the string is non-empty after trim
 * by using minLength: 1 and avoiding leading/trailing whitespace via the filter.
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
// Property 5: LocalStorage round-trip preserves all valid transactions
// ---------------------------------------------------------------------------

/**
 * **Validates: Requirements 5.1, 5.2, 5.3**
 *
 * For any array of valid Transaction objects, serializing to localStorage via
 * saveToStorage() and then deserializing via loadFromStorage() SHALL produce an
 * array that is deeply equal to the original (same items, same order, same field values).
 */
describe('Property 5: LocalStorage round-trip preserves all valid transactions', () => {
  test('round-trip deeply equals the original array for any valid transaction array', () => {
    fc.assert(
      fc.property(fc.array(validTransactionArbitrary), (transactions) => {
        // 1. Set the in-memory state to the generated array
        setTransactions(transactions);

        // 2. Persist to localStorage
        saveToStorage();

        // 3. Load back from localStorage
        const loaded = loadFromStorage();

        // 4. Assert deep equality — same items, same order, same field values
        expect(loaded).toEqual(transactions);
      }),
      { numRuns: 100 }
    );
  });
});
