/**
 * Unit tests for CATEGORIES and CATEGORY_COLORS constants (Task 2.1)
 * Requirements: 1.1, 4.5
 */

import { CATEGORIES, CATEGORY_COLORS, getTransactions } from '../js/app.js';

describe('CATEGORIES constant', () => {
  test('contains exactly Food, Transport, and Fun', () => {
    expect(CATEGORIES).toEqual(['Food', 'Transport', 'Fun']);
  });

  test('has exactly 3 entries', () => {
    expect(CATEGORIES).toHaveLength(3);
  });
});

describe('CATEGORY_COLORS constant', () => {
  test('has a color entry for every category', () => {
    CATEGORIES.forEach((cat) => {
      expect(CATEGORY_COLORS).toHaveProperty(cat);
    });
  });

  test('Food color is #FF6384', () => {
    expect(CATEGORY_COLORS.Food).toBe('#FF6384');
  });

  test('Transport color is #36A2EB', () => {
    expect(CATEGORY_COLORS.Transport).toBe('#36A2EB');
  });

  test('Fun color is #FFCE56', () => {
    expect(CATEGORY_COLORS.Fun).toBe('#FFCE56');
  });

  test('all color values are distinct', () => {
    const colors = Object.values(CATEGORY_COLORS);
    const unique = new Set(colors);
    expect(unique.size).toBe(colors.length);
  });
});

describe('transactions initial state', () => {
  test('starts as an empty array', () => {
    expect(getTransactions()).toEqual([]);
  });
});
