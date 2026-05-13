/**
 * Property-Based Test — Property 6: Malformed records are skipped on load
 *
 * Validates: Requirements 5.3
 *
 * For any LocalStorage payload that is a JSON array mixing valid Transaction
 * objects with malformed records (missing fields, wrong types, invalid category,
 * non-positive amount), loadFromStorage() SHALL return only the valid Transaction
 * objects and silently discard the malformed ones.
 */

import fc from 'fast-check';
import { STORAGE_KEY, loadFromStorage } from '../app.js';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Reusable positive amount arbitrary (valid range, ≤ 2 decimal places). */
const positiveAmountArb = fc
  .double({ min: 0.01, max: 999999.99, noNaN: true, noDefaultInfinity: true })
  .map((n) => Math.round(n * 100) / 100)
  .filter((n) => n > 0);

/** Reusable small positive amount arbitrary for malformed records. */
const smallPositiveAmountArb = fc
  .double({ min: 0.01, max: 999.99, noNaN: true, noDefaultInfinity: true })
  .map((n) => Math.round(n * 100) / 100)
  .filter((n) => n > 0);

/** Reusable non-empty trimmed string arbitrary. */
const nonEmptyStringArb = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => s.trim().length > 0);

/**
 * Generates a valid Transaction object that will pass loadFromStorage()'s
 * isValidTransaction filter.
 */
const validTransactionArbitrary = fc.record({
  id: fc.uuid(),
  itemName: nonEmptyStringArb,
  amount: positiveAmountArb,
  category: fc.constantFrom('Food', 'Transport', 'Fun'),
  createdAt: fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }),
});

/**
 * Generates a malformed record that will be rejected by isValidTransaction.
 * Each variant violates exactly one (or more) validation rules.
 */
const malformedRecordArbitrary = fc.oneof(
  // Missing id
  fc.record({
    itemName: nonEmptyStringArb,
    amount: smallPositiveAmountArb,
    category: fc.constantFrom('Food', 'Transport', 'Fun'),
    createdAt: fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }),
  }),
  // Empty string id
  fc.record({
    id: fc.constant(''),
    itemName: nonEmptyStringArb,
    amount: smallPositiveAmountArb,
    category: fc.constantFrom('Food', 'Transport', 'Fun'),
    createdAt: fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }),
  }),
  // Whitespace-only id
  fc.record({
    id: fc.constant('   '),
    itemName: nonEmptyStringArb,
    amount: smallPositiveAmountArb,
    category: fc.constantFrom('Food', 'Transport', 'Fun'),
    createdAt: fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }),
  }),
  // Missing itemName
  fc.record({
    id: fc.uuid(),
    amount: smallPositiveAmountArb,
    category: fc.constantFrom('Food', 'Transport', 'Fun'),
    createdAt: fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }),
  }),
  // Empty itemName
  fc.record({
    id: fc.uuid(),
    itemName: fc.constant(''),
    amount: smallPositiveAmountArb,
    category: fc.constantFrom('Food', 'Transport', 'Fun'),
    createdAt: fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }),
  }),
  // Whitespace-only itemName
  fc.record({
    id: fc.uuid(),
    itemName: fc.constant('   '),
    amount: smallPositiveAmountArb,
    category: fc.constantFrom('Food', 'Transport', 'Fun'),
    createdAt: fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }),
  }),
  // amount = 0
  fc.record({
    id: fc.uuid(),
    itemName: nonEmptyStringArb,
    amount: fc.constant(0),
    category: fc.constantFrom('Food', 'Transport', 'Fun'),
    createdAt: fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }),
  }),
  // Negative amount
  fc.record({
    id: fc.uuid(),
    itemName: nonEmptyStringArb,
    amount: fc.double({ min: -999999, max: -0.01, noNaN: true, noDefaultInfinity: true }),
    category: fc.constantFrom('Food', 'Transport', 'Fun'),
    createdAt: fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }),
  }),
  // amount is a string (non-number type)
  fc.record({
    id: fc.uuid(),
    itemName: nonEmptyStringArb,
    amount: fc.string({ minLength: 1, maxLength: 10 }).filter((s) => isNaN(Number(s))),
    category: fc.constantFrom('Food', 'Transport', 'Fun'),
    createdAt: fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }),
  }),
  // Invalid category
  fc.record({
    id: fc.uuid(),
    itemName: nonEmptyStringArb,
    amount: smallPositiveAmountArb,
    category: fc
      .string({ minLength: 1, maxLength: 20 })
      .filter((s) => !['Food', 'Transport', 'Fun'].includes(s)),
    createdAt: fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }),
  }),
  // Missing createdAt
  fc.record({
    id: fc.uuid(),
    itemName: nonEmptyStringArb,
    amount: smallPositiveAmountArb,
    category: fc.constantFrom('Food', 'Transport', 'Fun'),
  }),
  // createdAt is a string (non-number type)
  fc.record({
    id: fc.uuid(),
    itemName: nonEmptyStringArb,
    amount: smallPositiveAmountArb,
    category: fc.constantFrom('Food', 'Transport', 'Fun'),
    createdAt: fc.string({ minLength: 1, maxLength: 20 }),
  })
);

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  localStorage.clear();
});

// ---------------------------------------------------------------------------
// Property 6: Malformed records are skipped on load
// ---------------------------------------------------------------------------

/**
 * **Validates: Requirements 5.3**
 *
 * For any mixed array of valid and malformed records written directly to
 * localStorage, loadFromStorage() must return only the valid records —
 * same count, same content, in original order.
 */
describe('Property 6: Malformed records are skipped on load', () => {
  test('loadFromStorage() returns only valid records from a mixed array', () => {
    fc.assert(
      fc.property(
        fc.array(fc.oneof(validTransactionArbitrary, malformedRecordArbitrary)),
        (mixedRecords) => {
          // Determine which records are valid by applying the same rules
          // as isValidTransaction inside app.js.
          const expectedValid = mixedRecords.filter((record) => {
            if (typeof record !== 'object' || record === null) return false;
            const { id, itemName, amount, category, createdAt } = record;
            if (typeof id !== 'string' || id.trim() === '') return false;
            if (typeof itemName !== 'string' || itemName.trim() === '') return false;
            if (typeof amount !== 'number' || !isFinite(amount) || amount <= 0) return false;
            if (!['Food', 'Transport', 'Fun'].includes(category)) return false;
            if (typeof createdAt !== 'number') return false;
            return true;
          });

          // Write the mixed array directly to localStorage.
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mixedRecords));

          // Call loadFromStorage() and capture the result.
          const result = loadFromStorage();

          // Assert: result length matches expected valid count.
          expect(result).toHaveLength(expectedValid.length);

          // Assert: result contains exactly the valid records in original order.
          expect(result).toEqual(expectedValid);
        }
      ),
      { numRuns: 100 }
    );
  });
});
