/**
 * Property-based test for valid inputs accepted (Task 4.2)
 *
 * Property 1: Valid transaction addition grows the list
 * Validates: Requirements 1.2, 2.3
 *
 * For any valid form input (non-empty itemName ≤ 100 chars, positive amount
 * ≤ 999,999,999.99 with ≤ 2 decimal places, valid category), validateForm
 * SHALL return { valid: true }.
 */

import fc from 'fast-check';
import { validateForm } from '../app.js';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * Generates a non-empty string of printable ASCII characters, trimmed,
 * with length between 1 and 100 characters.
 *
 * fc.string() can produce empty strings and strings that trim to empty,
 * so we filter to guarantee the trimmed value is non-empty and ≤ 100 chars.
 */
const validItemNameArbitrary = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => s.trim().length > 0 && s.trim().length <= 100);

/**
 * Generates a string representation of a positive float that satisfies:
 *  - value > 0
 *  - value ≤ 999,999,999.99
 *  - at most 2 decimal places
 *
 * Strategy: generate an integer part (1–999999999) and an optional
 * fractional part (0–99 cents), then combine them.
 */
const validAmountArbitrary = fc
  .record({
    intPart: fc.integer({ min: 0, max: 999_999_999 }),
    centPart: fc.integer({ min: 0, max: 99 }),
  })
  .map(({ intPart, centPart }) => {
    // Ensure the total is > 0 (at least 1 cent)
    const totalCents = intPart * 100 + centPart;
    if (totalCents === 0) {
      // Shift to minimum valid value: $0.01
      return '0.01';
    }
    const dollars = Math.floor(totalCents / 100);
    const cents = totalCents % 100;
    return cents === 0
      ? String(dollars)
      : `${dollars}.${String(cents).padStart(2, '0')}`;
  })
  .filter((s) => {
    // Double-check the generated string passes all amount rules
    const v = parseFloat(s);
    return v > 0 && v <= 999_999_999.99;
  });

/**
 * Generates one of the three valid categories.
 */
const validCategoryArbitrary = fc.constantFrom('Food', 'Transport', 'Fun');

/**
 * Combines all three valid field arbitraries into a single record.
 */
const validFormInputArbitrary = fc.record({
  itemName: validItemNameArbitrary,
  amount: validAmountArbitrary,
  category: validCategoryArbitrary,
});

// ---------------------------------------------------------------------------
// Property test
// ---------------------------------------------------------------------------

describe('Property 1 — validateForm accepts all valid inputs', () => {
  /**
   * For any valid combination of itemName, amount, and category,
   * validateForm must return { valid: true } with no errors.
   *
   * Validates: Requirements 1.2, 2.3
   */
  test('validateForm returns valid:true for any valid input', () => {
    fc.assert(
      fc.property(validFormInputArbitrary, ({ itemName, amount, category }) => {
        const result = validateForm({ itemName, amount, category });
        return result.valid === true;
      }),
      { numRuns: 100 }
    );
  });
});
