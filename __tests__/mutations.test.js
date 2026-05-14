/**
 * Unit tests for state mutation functions (Tasks 5.1, 5.2)
 * Requirements: 1.2, 2.5, 3.2, 3.3, 5.1, 5.2
 */

import {
  addTransaction,
  deleteTransaction,
  getTransactions,
  setTransactions,
} from '../js/app.js';

// Reset state before each test so tests are isolated
beforeEach(() => {
  setTransactions([]);
  // Provide a minimal localStorage stub for jsdom
  localStorage.clear();
});

// Helper: a valid transaction input
const VALID_INPUT = { itemName: 'Lunch', amount: '12.50', category: 'Food' };

// ============================================================
// addTransaction — field correctness
// ============================================================

describe('addTransaction — appends with correct fields', () => {
  test('appends exactly one transaction to an empty array', () => {
    addTransaction(VALID_INPUT);
    expect(getTransactions()).toHaveLength(1);
  });

  test('stored transaction has a non-empty string id', () => {
    addTransaction(VALID_INPUT);
    const [tx] = getTransactions();
    expect(typeof tx.id).toBe('string');
    expect(tx.id.length).toBeGreaterThan(0);
  });

  test('stored transaction has itemName matching input', () => {
    addTransaction(VALID_INPUT);
    const [tx] = getTransactions();
    expect(tx.itemName).toBe('Lunch');
  });

  test('stored transaction has amount parsed as a number', () => {
    addTransaction(VALID_INPUT);
    const [tx] = getTransactions();
    expect(typeof tx.amount).toBe('number');
    expect(tx.amount).toBe(12.5);
  });

  test('stored transaction has category matching input', () => {
    addTransaction(VALID_INPUT);
    const [tx] = getTransactions();
    expect(tx.category).toBe('Food');
  });

  test('stored transaction has a numeric createdAt timestamp', () => {
    const before = Date.now();
    addTransaction(VALID_INPUT);
    const after = Date.now();
    const [tx] = getTransactions();
    expect(typeof tx.createdAt).toBe('number');
    expect(tx.createdAt).toBeGreaterThanOrEqual(before);
    expect(tx.createdAt).toBeLessThanOrEqual(after);
  });
});

// ============================================================
// addTransaction — multiple calls grow the array
// ============================================================

describe('addTransaction — multiple calls grow the array', () => {
  test('two calls result in array length 2', () => {
    addTransaction({ itemName: 'Coffee', amount: '3.00', category: 'Food' });
    addTransaction({ itemName: 'Bus', amount: '2.50', category: 'Transport' });
    expect(getTransactions()).toHaveLength(2);
  });

  test('three calls result in array length 3', () => {
    addTransaction({ itemName: 'Coffee', amount: '3.00', category: 'Food' });
    addTransaction({ itemName: 'Bus', amount: '2.50', category: 'Transport' });
    addTransaction({ itemName: 'Movie', amount: '15.00', category: 'Fun' });
    expect(getTransactions()).toHaveLength(3);
  });

  test('each call appends to the end (preserves insertion order)', () => {
    addTransaction({ itemName: 'First', amount: '1.00', category: 'Food' });
    addTransaction({ itemName: 'Second', amount: '2.00', category: 'Transport' });
    const txs = getTransactions();
    expect(txs[0].itemName).toBe('First');
    expect(txs[1].itemName).toBe('Second');
  });

  test('each transaction gets a unique id', () => {
    addTransaction({ itemName: 'A', amount: '1.00', category: 'Food' });
    addTransaction({ itemName: 'B', amount: '2.00', category: 'Food' });
    const [tx1, tx2] = getTransactions();
    expect(tx1.id).not.toBe(tx2.id);
  });
});

// ============================================================
// deleteTransaction — removes the correct item by id
// ============================================================

// Helper: build a minimal valid Transaction object
function makeTransaction(id, overrides = {}) {
  return {
    id,
    itemName: 'Test Item',
    amount: 10.00,
    category: 'Food',
    createdAt: Date.now(),
    ...overrides,
  };
}

describe('deleteTransaction — removes the correct item by id', () => {
  test('removes the only transaction when its id matches', () => {
    const tx = makeTransaction('id-1');
    setTransactions([tx]);

    deleteTransaction('id-1');

    expect(getTransactions()).toHaveLength(0);
  });

  test('removes the correct transaction from a list of many', () => {
    const tx1 = makeTransaction('id-1');
    const tx2 = makeTransaction('id-2');
    const tx3 = makeTransaction('id-3');
    setTransactions([tx1, tx2, tx3]);

    deleteTransaction('id-2');

    const remaining = getTransactions();
    expect(remaining).toHaveLength(2);
    expect(remaining.find(t => t.id === 'id-2')).toBeUndefined();
    expect(remaining.find(t => t.id === 'id-1')).toBeDefined();
    expect(remaining.find(t => t.id === 'id-3')).toBeDefined();
  });

  test('preserves the relative order of remaining transactions', () => {
    const tx1 = makeTransaction('id-1');
    const tx2 = makeTransaction('id-2');
    const tx3 = makeTransaction('id-3');
    setTransactions([tx1, tx2, tx3]);

    deleteTransaction('id-2');

    const remaining = getTransactions();
    expect(remaining[0].id).toBe('id-1');
    expect(remaining[1].id).toBe('id-3');
  });
});

// ============================================================
// deleteTransaction — unknown id leaves array unchanged
// ============================================================

describe('deleteTransaction — unknown id leaves array unchanged', () => {
  test('does not mutate the array when id does not exist', () => {
    const tx1 = makeTransaction('id-1');
    const tx2 = makeTransaction('id-2');
    setTransactions([tx1, tx2]);

    deleteTransaction('nonexistent-id');

    const remaining = getTransactions();
    expect(remaining).toHaveLength(2);
    expect(remaining[0].id).toBe('id-1');
    expect(remaining[1].id).toBe('id-2');
  });

  test('does not mutate the array when id is an empty string', () => {
    const tx = makeTransaction('id-1');
    setTransactions([tx]);

    deleteTransaction('');

    expect(getTransactions()).toHaveLength(1);
  });
});

// ============================================================
// deleteTransaction — empty array does nothing
// ============================================================

describe('deleteTransaction — empty array does nothing', () => {
  test('calling on an empty array leaves it empty', () => {
    setTransactions([]);

    deleteTransaction('any-id');

    expect(getTransactions()).toHaveLength(0);
  });
});
