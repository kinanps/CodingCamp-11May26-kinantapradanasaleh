/**
 * Unit tests for validateForm() (Task 4.1)
 * Requirements: 1.2, 1.3, 1.4
 */

import { validateForm } from '../js/app.js';

// Helper: a known-good set of inputs
const VALID = { itemName: 'Lunch', amount: '12.50', category: 'Food' };

describe('validateForm — valid inputs', () => {
  test('accepts a valid transaction with all fields correct', () => {
    const result = validateForm(VALID);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  test('accepts amount with exactly 2 decimal places', () => {
    const result = validateForm({ ...VALID, amount: '9.99' });
    expect(result.valid).toBe(true);
  });

  test('accepts amount with 1 decimal place', () => {
    const result = validateForm({ ...VALID, amount: '5.5' });
    expect(result.valid).toBe(true);
  });

  test('accepts amount with no decimal places', () => {
    const result = validateForm({ ...VALID, amount: '100' });
    expect(result.valid).toBe(true);
  });

  test('accepts maximum allowed amount (999999999.99)', () => {
    const result = validateForm({ ...VALID, amount: '999999999.99' });
    expect(result.valid).toBe(true);
  });

  test('accepts item name of exactly 100 characters', () => {
    const name100 = 'a'.repeat(100);
    const result = validateForm({ ...VALID, itemName: name100 });
    expect(result.valid).toBe(true);
  });

  test('accepts all valid categories', () => {
    ['Food', 'Transport', 'Fun'].forEach((cat) => {
      const result = validateForm({ ...VALID, category: cat });
      expect(result.valid).toBe(true);
    });
  });
});

describe('validateForm — itemName errors', () => {
  test('rejects empty item name', () => {
    const result = validateForm({ ...VALID, itemName: '' });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('itemName');
  });

  test('rejects whitespace-only item name', () => {
    const result = validateForm({ ...VALID, itemName: '   ' });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('itemName');
  });

  test('rejects item name longer than 100 characters', () => {
    const longName = 'a'.repeat(101);
    const result = validateForm({ ...VALID, itemName: longName });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('itemName');
  });
});

describe('validateForm — amount errors', () => {
  test('rejects amount = 0', () => {
    const result = validateForm({ ...VALID, amount: '0' });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('amount');
  });

  test('rejects negative amount', () => {
    const result = validateForm({ ...VALID, amount: '-5' });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('amount');
  });

  test('rejects amount greater than 999,999,999.99', () => {
    const result = validateForm({ ...VALID, amount: '1000000000' });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('amount');
  });

  test('rejects amount with 3 decimal places (e.g. 1.001)', () => {
    const result = validateForm({ ...VALID, amount: '1.001' });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('amount');
  });

  test('rejects non-numeric amount string', () => {
    const result = validateForm({ ...VALID, amount: 'abc' });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('amount');
  });

  test('rejects empty amount string', () => {
    const result = validateForm({ ...VALID, amount: '' });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('amount');
  });
});

describe('validateForm — category errors', () => {
  test('rejects invalid category value', () => {
    const result = validateForm({ ...VALID, category: 'Entertainment' });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('category');
  });

  test('rejects empty category string', () => {
    const result = validateForm({ ...VALID, category: '' });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('category');
  });
});

describe('validateForm — multiple errors', () => {
  test('reports errors for all invalid fields simultaneously', () => {
    const result = validateForm({ itemName: '', amount: '-1', category: 'Bad' });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveProperty('itemName');
    expect(result.errors).toHaveProperty('amount');
    expect(result.errors).toHaveProperty('category');
  });
});
