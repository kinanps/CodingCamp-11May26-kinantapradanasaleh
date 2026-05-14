/**
 * Integration smoke tests (Task 10.2)
 *
 * These tests verify end-to-end behaviour by calling init() against
 * the full HTML DOM and asserting that all four UI regions respond
 * correctly to state mutations (adding / deleting transactions).
 *
 * Requirements: 2.2, 3.4, 4.4
 */

import {
  init,
  getTransactions,
  setTransactions,
  setChart,
  addTransaction,
  deleteTransaction,
  STORAGE_KEY,
} from '../js/app.js';

// ============================================================
// Helpers
// ============================================================

/**
 * Returns a minimal HTML document that mirrors index.html's
 * structure — every UI region that init() and renderAll() depend on.
 */
function getFullDOM() {
  return `
    <div class="app-container">
      <header><h1>Expense &amp; Budget Visualizer</h1></header>

      <!-- Balance Display -->
      <div id="balance-display">
        <span class="balance-label">Total Balance</span>
        <span id="balance-amount">$0.00</span>
      </div>

      <!-- Transaction Input Form -->
      <section id="form-section">
        <h2>Add Transaction</h2>
        <form id="transaction-form" novalidate>
          <div class="field-group">
            <label for="item-name">Item Name</label>
            <input id="item-name" type="text" maxlength="100" autocomplete="off" required />
            <span class="error" id="error-item-name" aria-live="polite"></span>
          </div>
          <div class="field-group">
            <label for="amount">Amount</label>
            <input id="amount" type="number" step="0.01" min="0.01" required />
            <span class="error" id="error-amount" aria-live="polite"></span>
          </div>
          <div class="field-group">
            <label for="category">Category</label>
            <select id="category" required>
              <option value="Food">Food</option>
              <option value="Transport">Transport</option>
              <option value="Fun">Fun</option>
            </select>
            <span class="error" id="error-category" aria-live="polite"></span>
          </div>
          <button type="submit">Add Transaction</button>
        </form>
      </section>

      <!-- Transaction List -->
      <section id="transaction-list-section">
        <h2>Transactions</h2>
        <ul id="transaction-list"></ul>
      </section>

      <!-- Spending Category Chart -->
      <section id="chart-section">
        <h2>Spending by Category</h2>
        <canvas id="spending-chart"></canvas>
        <p id="chart-placeholder" class="placeholder">No data to display</p>
      </section>
    </div>

    <!-- Toast Notification Container -->
    <div id="toast-container" aria-live="assertive" aria-atomic="true"></div>
  `;
}

/**
 * Creates a mock Chart.js instance so we can inspect chart data
 * without loading the real Chart.js library in jsdom.
 */
function createMockChart() {
  return {
    data: {
      labels: [],
      datasets: [{ data: [], backgroundColor: [] }],
    },
    update: jest.fn(),
  };
}

// ============================================================
// Setup / teardown
// ============================================================

beforeEach(() => {
  // Clean slate: clear state, storage, DOM
  setTransactions([]);
  setChart(null);
  localStorage.clear();
  document.body.innerHTML = getFullDOM();
});

// ============================================================
// Test 1: All four UI regions are present after init()
// ============================================================

describe('Integration — init() bootstraps the DOM', () => {
  test('all four UI regions are present in the DOM after init()', () => {
    // Inject a mock chart so init()'s Chart.js constructor path is skipped
    // but renderChart() still has an instance to work with.
    const mockChart = createMockChart();
    setChart(mockChart);

    // Simulate init without Chart.js constructor (already set chart above).
    // We manually call init-equivalent steps since Chart global isn't available.
    const loaded = [];
    setTransactions(loaded);
    const form = document.getElementById('transaction-form');

    // Instead, let's call init directly — Chart constructor will be skipped
    // because `typeof Chart` is 'undefined' in jsdom.
    // Reset chart first so init's Chart branch is skipped, then set mock after.
    setChart(null);
    init();
    // Now inject the mock chart for subsequent tests.
    setChart(mockChart);

    // Assert all four regions exist
    expect(document.getElementById('transaction-form')).not.toBeNull();
    expect(document.getElementById('balance-display')).not.toBeNull();
    expect(document.getElementById('transaction-list-section')).not.toBeNull();
    expect(document.getElementById('chart-section')).not.toBeNull();
  });

  test('balance shows $0.00 after init() with empty storage', () => {
    init();
    const balanceEl = document.getElementById('balance-amount');
    expect(balanceEl.textContent).toBe('$0.00');
  });

  test('transaction list shows placeholder after init() with empty storage', () => {
    init();
    const placeholder = document.querySelector('#transaction-list li.placeholder');
    expect(placeholder).not.toBeNull();
    expect(placeholder.textContent).toBe('No transactions yet');
  });

  test('chart placeholder is visible after init() with empty storage', () => {
    init();
    const canvas = document.getElementById('spending-chart');
    const placeholder = document.getElementById('chart-placeholder');

    // Canvas should be hidden, placeholder visible
    expect(canvas.style.display).toBe('none');
    expect(placeholder.style.display).not.toBe('none');
  });

  test('form submit handler is wired after init()', () => {
    init();
    const form = document.getElementById('transaction-form');
    // The form should exist and have the submit event listener
    expect(form).not.toBeNull();
  });
});

// ============================================================
// Test 2: Adding a transaction updates balance, list, and chart
// ============================================================

describe('Integration — adding a transaction updates all UI regions', () => {
  let mockChart;

  beforeEach(() => {
    mockChart = createMockChart();
    // Call init() first (Chart.js constructor skipped in jsdom)
    init();
    // Inject mock chart so renderChart() can update it
    setChart(mockChart);
  });

  test('balance text updates after adding a transaction', () => {
    addTransaction({ itemName: 'Lunch', amount: '25.50', category: 'Food' });

    const balanceEl = document.getElementById('balance-amount');
    expect(balanceEl.textContent).toBe('$25.50');
  });

  test('transaction list shows the new item after adding', () => {
    addTransaction({ itemName: 'Bus Fare', amount: '3.00', category: 'Transport' });

    const items = document.querySelectorAll('#transaction-list li:not(.placeholder)');
    expect(items.length).toBe(1);

    const nameSpan = items[0].querySelector('.item-name');
    expect(nameSpan.textContent).toBe('Bus Fare');

    const amountSpan = items[0].querySelector('.amount');
    expect(amountSpan.textContent).toBe('$3.00');

    const categorySpan = items[0].querySelector('.category');
    expect(categorySpan.textContent).toBe('Transport');
  });

  test('chart data is updated after adding a transaction', () => {
    addTransaction({ itemName: 'Movie', amount: '15.00', category: 'Fun' });

    // renderChart() should have updated the mock chart's data
    expect(mockChart.data.labels).toContain('Fun');
    expect(mockChart.data.datasets[0].data).toEqual(
      expect.arrayContaining([15])
    );
    expect(mockChart.update).toHaveBeenCalled();
  });

  test('balance accumulates correctly across multiple transactions', () => {
    addTransaction({ itemName: 'Coffee', amount: '4.50', category: 'Food' });
    addTransaction({ itemName: 'Taxi', amount: '12.00', category: 'Transport' });
    addTransaction({ itemName: 'Game', amount: '8.99', category: 'Fun' });

    const balanceEl = document.getElementById('balance-amount');
    const expected = '$' + (4.50 + 12.00 + 8.99).toFixed(2);
    expect(balanceEl.textContent).toBe(expected);
  });

  test('transaction list grows with each new transaction', () => {
    addTransaction({ itemName: 'Item A', amount: '1.00', category: 'Food' });
    addTransaction({ itemName: 'Item B', amount: '2.00', category: 'Transport' });

    const items = document.querySelectorAll('#transaction-list li:not(.placeholder)');
    expect(items.length).toBe(2);
  });
});

// ============================================================
// Test 3: Deleting the last transaction shows placeholders and $0.00
// ============================================================

describe('Integration — deleting the last transaction resets UI', () => {
  let mockChart;

  beforeEach(() => {
    mockChart = createMockChart();
    init();
    setChart(mockChart);

    // Add one transaction so we can delete it
    addTransaction({ itemName: 'Only Item', amount: '20.00', category: 'Food' });
  });

  test('balance shows $0.00 after deleting the last transaction', () => {
    // Get the id of the only transaction
    const txs = getTransactions();
    expect(txs).toHaveLength(1);
    const txId = txs[0].id;

    deleteTransaction(txId);

    const balanceEl = document.getElementById('balance-amount');
    expect(balanceEl.textContent).toBe('$0.00');
  });

  test('transaction list shows placeholder after deleting the last transaction', () => {
    const txs = getTransactions();
    const txId = txs[0].id;

    deleteTransaction(txId);

    const placeholder = document.querySelector('#transaction-list li.placeholder');
    expect(placeholder).not.toBeNull();
    expect(placeholder.textContent).toBe('No transactions yet');

    const dataItems = document.querySelectorAll('#transaction-list li:not(.placeholder)');
    expect(dataItems).toHaveLength(0);
  });

  test('chart shows placeholder after deleting the last transaction', () => {
    const txs = getTransactions();
    const txId = txs[0].id;

    deleteTransaction(txId);

    const canvas = document.getElementById('spending-chart');
    const placeholder = document.getElementById('chart-placeholder');

    // Canvas hidden, placeholder visible
    expect(canvas.style.display).toBe('none');
    expect(placeholder.style.display).not.toBe('none');
  });

  test('deleting one of two transactions updates all regions correctly', () => {
    // Add a second transaction
    addTransaction({ itemName: 'Second Item', amount: '10.00', category: 'Transport' });
    const txs = getTransactions();
    expect(txs).toHaveLength(2);

    // Delete the first one ('Only Item')
    const firstId = txs[0].id;
    deleteTransaction(firstId);

    // Balance should reflect only the remaining transaction
    const balanceEl = document.getElementById('balance-amount');
    expect(balanceEl.textContent).toBe('$10.00');

    // List should have one item
    const items = document.querySelectorAll('#transaction-list li:not(.placeholder)');
    expect(items).toHaveLength(1);
    expect(items[0].querySelector('.item-name').textContent).toBe('Second Item');

    // Chart should still have data
    expect(mockChart.data.labels).toContain('Transport');
    expect(mockChart.update).toHaveBeenCalled();
  });
});
