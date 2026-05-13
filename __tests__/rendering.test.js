/**
 * Unit tests for renderList() (Task 7.3)
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

import {
  renderList,
  setTransactions,
  deleteTransaction,
} from '../app.js';

// ============================================================
// DOM setup — provide #transaction-list before each test
// ============================================================

beforeEach(() => {
  // Reset in-memory state
  setTransactions([]);
  // Reset localStorage
  localStorage.clear();
  // Provide a minimal DOM with the required list element
  document.body.innerHTML = '<ul id="transaction-list"></ul>';
});

// ============================================================
// Helper: build a minimal valid Transaction object
// ============================================================

let _idCounter = 0;
function makeTransaction(overrides = {}) {
  _idCounter += 1;
  return {
    id: 'tx-' + _idCounter,
    itemName: 'Item ' + _idCounter,
    amount: 10.00,
    category: 'Food',
    createdAt: Date.now() + _idCounter,
    ...overrides,
  };
}

// ============================================================
// Placeholder — shown when transaction list is empty
// ============================================================

describe('renderList — empty state', () => {
  test('shows a placeholder <li> when there are no transactions', () => {
    setTransactions([]);
    renderList();

    const list = document.getElementById('transaction-list');
    expect(list.children).toHaveLength(1);

    const placeholder = list.querySelector('li.placeholder');
    expect(placeholder).not.toBeNull();
    expect(placeholder.textContent).toBe('No transactions yet');
  });

  test('placeholder replaces any previously rendered items', () => {
    const tx = makeTransaction();
    setTransactions([tx]);
    renderList(); // renders one item

    setTransactions([]);
    renderList(); // should now show placeholder

    const list = document.getElementById('transaction-list');
    expect(list.querySelectorAll('li:not(.placeholder)')).toHaveLength(0);
    expect(list.querySelector('li.placeholder')).not.toBeNull();
  });
});

// ============================================================
// Newest-first ordering
// ============================================================

describe('renderList — newest-first ordering', () => {
  test('renders items in reverse insertion order (newest first)', () => {
    const tx1 = makeTransaction({ itemName: 'First', createdAt: 1000 });
    const tx2 = makeTransaction({ itemName: 'Second', createdAt: 2000 });
    const tx3 = makeTransaction({ itemName: 'Third', createdAt: 3000 });
    setTransactions([tx1, tx2, tx3]);
    renderList();

    const list = document.getElementById('transaction-list');
    const items = list.querySelectorAll('li');
    expect(items).toHaveLength(3);

    // Newest (tx3) should be first in the DOM
    expect(items[0].querySelector('.item-name').textContent).toBe('Third');
    expect(items[1].querySelector('.item-name').textContent).toBe('Second');
    expect(items[2].querySelector('.item-name').textContent).toBe('First');
  });

  test('single transaction renders without reordering', () => {
    const tx = makeTransaction({ itemName: 'Solo' });
    setTransactions([tx]);
    renderList();

    const list = document.getElementById('transaction-list');
    const items = list.querySelectorAll('li');
    expect(items).toHaveLength(1);
    expect(items[0].querySelector('.item-name').textContent).toBe('Solo');
  });
});

// ============================================================
// Item content — name, amount, category
// ============================================================

describe('renderList — item content', () => {
  test('each item shows the correct item name', () => {
    const tx = makeTransaction({ itemName: 'Lunch' });
    setTransactions([tx]);
    renderList();

    const nameSpan = document.querySelector('#transaction-list .item-name');
    expect(nameSpan).not.toBeNull();
    expect(nameSpan.textContent).toBe('Lunch');
  });

  test('each item shows the amount formatted as $X.XX', () => {
    const tx = makeTransaction({ amount: 12.5 });
    setTransactions([tx]);
    renderList();

    const amountSpan = document.querySelector('#transaction-list .amount');
    expect(amountSpan).not.toBeNull();
    expect(amountSpan.textContent).toBe('$12.50');
  });

  test('formats whole-number amounts with two decimal places', () => {
    const tx = makeTransaction({ amount: 5 });
    setTransactions([tx]);
    renderList();

    const amountSpan = document.querySelector('#transaction-list .amount');
    expect(amountSpan.textContent).toBe('$5.00');
  });

  test('each item shows the correct category', () => {
    const tx = makeTransaction({ category: 'Transport' });
    setTransactions([tx]);
    renderList();

    const categorySpan = document.querySelector('#transaction-list .category');
    expect(categorySpan).not.toBeNull();
    expect(categorySpan.textContent).toBe('Transport');
  });

  test('each item has a data-id attribute matching the transaction id', () => {
    const tx = makeTransaction({ id: 'unique-id-123' });
    setTransactions([tx]);
    renderList();

    const li = document.querySelector('#transaction-list li');
    expect(li.dataset.id).toBe('unique-id-123');
  });

  test('each item has a delete button with class delete-btn', () => {
    const tx = makeTransaction();
    setTransactions([tx]);
    renderList();

    const btn = document.querySelector('#transaction-list .delete-btn');
    expect(btn).not.toBeNull();
    expect(btn.tagName).toBe('BUTTON');
  });

  test('delete button has aria-label containing the item name', () => {
    const tx = makeTransaction({ itemName: 'Coffee' });
    setTransactions([tx]);
    renderList();

    const btn = document.querySelector('#transaction-list .delete-btn');
    expect(btn.getAttribute('aria-label')).toBe('Delete Coffee');
  });
});

// ============================================================
// Delete button — calls deleteTransaction with correct id
// ============================================================

describe('renderList — delete button behaviour', () => {
  test('clicking delete button removes the transaction from state', () => {
    const tx = makeTransaction({ id: 'del-id-1' });
    setTransactions([tx]);
    renderList();

    const btn = document.querySelector('#transaction-list .delete-btn');
    btn.click();

    // After deletion the list should be empty (placeholder shown)
    renderList();
    const placeholder = document.querySelector('#transaction-list li.placeholder');
    expect(placeholder).not.toBeNull();
  });

  test('clicking delete button for one item leaves others intact', () => {
    const tx1 = makeTransaction({ id: 'keep-1', itemName: 'Keep' });
    const tx2 = makeTransaction({ id: 'remove-2', itemName: 'Remove' });
    setTransactions([tx1, tx2]);
    renderList();

    // tx2 is newest so it renders first; its delete button is first
    const buttons = document.querySelectorAll('#transaction-list .delete-btn');
    // buttons[0] corresponds to tx2 (newest-first), buttons[1] to tx1
    buttons[0].click(); // delete tx2

    renderList();

    const items = document.querySelectorAll('#transaction-list li:not(.placeholder)');
    expect(items).toHaveLength(1);
    expect(items[0].querySelector('.item-name').textContent).toBe('Keep');
  });
});

// ============================================================
// Null-safety — missing #transaction-list element
// ============================================================

describe('renderList — null safety', () => {
  test('does not throw when #transaction-list element is absent', () => {
    document.body.innerHTML = ''; // remove the list element
    setTransactions([makeTransaction()]);

    expect(() => renderList()).not.toThrow();
  });
});
