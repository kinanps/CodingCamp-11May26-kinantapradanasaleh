/**
 * Property-Based Test: Property 2 — Invalid inputs are rejected without mutating state
 *
 * **Validates: Requirements 1.3, 1.4**
 *
 * For any invalid form input (empty fields, zero/negative/non-numeric amount,
 * amount exceeding maximum, or amount with more than 2 decimal places),
 * validateForm SHALL return valid: false and the transactions array SHALL remain unchanged.
 */

import fc from 'fast-check';
import { validateForm, getTransactions, setTransactions } from '../app.js';

// ---------------------------------------------------------------------------
// Arbitraries for invalid inputs
// ---------------------------------------------------------------------------

/** Empty or whitespace-only item name */
const emptyItemName = fc.oneof(
  fc.constant(''),
  fc.stringOf(fc.constantFrom(' ', '\t', '\n'), { minLength: 1, maxLength: 10 })
);

/** Amount = '0' or a negative number string */
const zeroOrNegativeAmount = fc.oneof(
  fc.constant('0'),
  fc.double({ min: -1_000_000, max: -0.01, noNaN: true }).map(n => String(n))
);

/**
 * Non-numeric amount string — strings where parseFloat(s.trim()) is NaN.
 * Note: parseFloat('10$') === 10, parseFloat('1e') === 1, etc.
 * We only use strings that start with a non-numeric character so parseFloat
 * returns NaN, matching exactly what validateForm checks.
 */
const nonNumericAmount = fc.oneof(
  fc.constant('abc'),
  fc.constant('xyz'),
  fc.constant('$10'),
  fc.constant('one'),
  fc.constant('NaN'),
  fc.constant('hello'),
  // Strings starting with a letter or special char (not digit, not +/-, not .)
  // so parseFloat returns NaN
  fc.string({ minLength: 1, maxLength: 10 }).filter(s => {
    const trimmed = s.trim();
    if (trimmed === '') return false;
    return isNaN(parseFloat(trimmed));
  })
);

/** Amount exceeding the maximum allowed value (999,999,999.99) */
const excessiveAmount = fc.double({ min: 1_000_000_000, max: 1e15, noNaN: true })
  .map(n => n.toFixed(2));

/** Amount with more than 2 decimal places */
const tooManyDecimalsAmount = fc.integer({ min: 1, max: 999_999 })
  .chain(intPart =>
    fc.integer({ min: 1, max: 999 }).map(fracPart => `${intPart}.${String(fracPart).padStart(3, '0')}`)
  );

/** Invalid category (not in ['Food', 'Transport', 'Fun']) */
const invalidCategory = fc.oneof(
  fc.constant(''),
  fc.constant('Entertainment'),
  fc.constant('food'),        // wrong case
  fc.constant('transport'),   // wrong case
  fc.constant('fun'),         // wrong case
  fc.constant('Other'),
  fc.string({ minLength: 1, maxLength: 20 }).filter(
    s => !['Food', 'Transport', 'Fun'].includes(s)
  )
);

/** A valid item name (used when we only want to invalidate other fields) */
const validItemName = fc.string({ minLength: 1, maxLength: 100 }).filter(
  s => s.trim().length > 0 && s.trim().length <= 100
);

/** A valid amount string (used when we only want to invalidate other fields) */
const validAmount = fc.double({ min: 0.01, max: 999_999_999.99, noNaN: true })
  .map(n => n.toFixed(2));

/** A valid category */
const validCategory = fc.constantFrom('Food', 'Transport', 'Fun');

// ---------------------------------------------------------------------------
// A known initial transactions array for state-mutation checks
// ---------------------------------------------------------------------------
const INITIAL_TRANSACTIONS = [
  { id: 'tx-1', itemName: 'Lunch', amount: 12.5, category: 'Food', createdAt: 1000 },
  { id: 'tx-2', itemName: 'Bus', amount: 2.0, category: 'Transport', createdAt: 2000 },
];

// ---------------------------------------------------------------------------
// Helper: reset state before each property run
// ---------------------------------------------------------------------------
function resetState() {
  setTransactions([...INITIAL_TRANSACTIONS]);
}

// ---------------------------------------------------------------------------
// Property 2 tests
// ---------------------------------------------------------------------------

describe('Property 2: Invalid inputs are rejected without mutating state', () => {

  test('empty/whitespace-only itemName → valid: false, state unchanged', () => {
    fc.assert(
      fc.property(emptyItemName, validAmount, validCategory, (itemName, amount, category) => {
        resetState();
        const before = getTransactions().slice();

        const result = validateForm({ itemName, amount, category });

        expect(result.valid).toBe(false);
        expect(getTransactions()).toEqual(before);
      }),
      { numRuns: 100 }
    );
  });

  test('zero or negative amount → valid: false, state unchanged', () => {
    fc.assert(
      fc.property(validItemName, zeroOrNegativeAmount, validCategory, (itemName, amount, category) => {
        resetState();
        const before = getTransactions().slice();

        const result = validateForm({ itemName, amount, category });

        expect(result.valid).toBe(false);
        expect(getTransactions()).toEqual(before);
      }),
      { numRuns: 100 }
    );
  });

  test('non-numeric amount → valid: false, state unchanged', () => {
    fc.assert(
      fc.property(validItemName, nonNumericAmount, validCategory, (itemName, amount, category) => {
        resetState();
        const before = getTransactions().slice();

        const result = validateForm({ itemName, amount, category });

        expect(result.valid).toBe(false);
        expect(getTransactions()).toEqual(before);
      }),
      { numRuns: 100 }
    );
  });

  test('amount exceeding maximum (> 999,999,999.99) → valid: false, state unchanged', () => {
    fc.assert(
      fc.property(validItemName, excessiveAmount, validCategory, (itemName, amount, category) => {
        resetState();
        const before = getTransactions().slice();

        const result = validateForm({ itemName, amount, category });

        expect(result.valid).toBe(false);
        expect(getTransactions()).toEqual(before);
      }),
      { numRuns: 100 }
    );
  });

  test('amount with > 2 decimal places → valid: false, state unchanged', () => {
    fc.assert(
      fc.property(validItemName, tooManyDecimalsAmount, validCategory, (itemName, amount, category) => {
        resetState();
        const before = getTransactions().slice();

        const result = validateForm({ itemName, amount, category });

        expect(result.valid).toBe(false);
        expect(getTransactions()).toEqual(before);
      }),
      { numRuns: 100 }
    );
  });

  test('invalid category → valid: false, state unchanged', () => {
    fc.assert(
      fc.property(validItemName, validAmount, invalidCategory, (itemName, amount, category) => {
        resetState();
        const before = getTransactions().slice();

        const result = validateForm({ itemName, amount, category });

        expect(result.valid).toBe(false);
        expect(getTransactions()).toEqual(before);
      }),
      { numRuns: 100 }
    );
  });

  test('any combination of invalid inputs via fc.oneof → valid: false, state unchanged', () => {
    const anyInvalidInput = fc.oneof(
      // invalid itemName, valid amount, valid category
      fc.record({
        itemName: emptyItemName,
        amount: validAmount,
        category: validCategory,
      }),
      // valid itemName, zero/negative amount, valid category
      fc.record({
        itemName: validItemName,
        amount: zeroOrNegativeAmount,
        category: validCategory,
      }),
      // valid itemName, non-numeric amount, valid category
      fc.record({
        itemName: validItemName,
        amount: nonNumericAmount,
        category: validCategory,
      }),
      // valid itemName, excessive amount, valid category
      fc.record({
        itemName: validItemName,
        amount: excessiveAmount,
        category: validCategory,
      }),
      // valid itemName, too many decimals, valid category
      fc.record({
        itemName: validItemName,
        amount: tooManyDecimalsAmount,
        category: validCategory,
      }),
      // valid itemName, valid amount, invalid category
      fc.record({
        itemName: validItemName,
        amount: validAmount,
        category: invalidCategory,
      })
    );

    fc.assert(
      fc.property(anyInvalidInput, ({ itemName, amount, category }) => {
        resetState();
        const before = getTransactions().slice();

        const result = validateForm({ itemName, amount, category });

        expect(result.valid).toBe(false);
        expect(getTransactions()).toEqual(before);
      }),
      { numRuns: 200 }
    );
  });

});
