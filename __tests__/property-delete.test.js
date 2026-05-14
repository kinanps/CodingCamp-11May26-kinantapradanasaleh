/**
 * Property-based test for delete mutation (Task 5.3)
 *
 * Property 4: Delete removes exactly the targeted transaction
 * Validates: Requirements 2.5, 3.3
 *
 * For any transaction list containing at least one transaction, deleting a
 * transaction by its id SHALL result in a list that contains every original
 * transaction except the one with that id, with all other transactions
 * unchanged and in their original relative order.
 */

import fc from 'fast-check';
import {
  deleteTransaction,
  getTransactions,
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
// Property 4: Delete removes exactly the targeted transaction
// ---------------------------------------------------------------------------

/**
 * **Validates: Requirements 2.5, 3.3**
 *
 * For any non-empty array of valid transactions, picking any one transaction
 * by index and deleting it by id SHALL:
 *  1. Reduce the array length by exactly 1
 *  2. Leave all other transactions unchanged and in their original relative order
 */
describe('Property 4: Delete removes exactly the targeted transaction', () => {
  test('deleteTransaction removes only the targeted item and preserves order of remaining items', () => {
    fc.assert(
      fc.property(
        fc
          .array(validTransactionArbitrary, { minLength: 1 })
          .chain((transactions) =>
            fc.tuple(
              fc.constant(transactions),
              fc.integer({ min: 0, max: transactions.length - 1 })
            )
          ),
        ([transactions, index]) => {
          // 1. Set the in-memory state to the generated array
          setTransactions(transactions);

          const targetId = transactions[index].id;
          const originalLength = transactions.length;

          // 2. Delete the transaction at the chosen index
          deleteTransaction(targetId);

          const result = getTransactions();

          // 3. Assert length decreased by exactly 1
          expect(result.length).toBe(originalLength - 1);

          // 4. Assert the deleted transaction is no longer present
          expect(result.find((t) => t.id === targetId)).toBeUndefined();

          // 5. Assert all other items are unchanged and in original relative order
          const expectedRemaining = transactions.filter((t) => t.id !== targetId);
          expect(result).toEqual(expectedRemaining);
        }
      ),
      { numRuns: 100 }
    );
  });
});
