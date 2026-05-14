/**
 * Property-based test for chart rendering (Task 7.5)
 *
 * Property 7: Chart data matches aggregated category totals
 * Validates: Requirements 4.1, 4.5
 *
 * For any non-empty transaction list, the data passed to the Chart.js instance
 * by renderChart() SHALL contain exactly one entry per category that has a
 * non-zero total, with each entry's value equal to the sum of `amount` for all
 * transactions in that category, and each entry's color equal to the fixed color
 * defined in CATEGORY_COLORS for that category.
 */

import fc from 'fast-check';
import {
  renderChart,
  setTransactions,
  setChart,
  CATEGORIES,
  CATEGORY_COLORS,
} from '../js/app.js';

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  // Set up a minimal DOM with the elements renderChart() looks for
  document.body.innerHTML = `
    <canvas id="spending-chart"></canvas>
    <p id="chart-placeholder">No data to display</p>
  `;

  setTransactions([]);
  localStorage.clear();
});

afterEach(() => {
  // Reset chart injection so tests don't bleed into each other
  setChart(null);
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
// Property 7: Chart data matches aggregated category totals
// ---------------------------------------------------------------------------

/**
 * **Validates: Requirements 4.1, 4.5**
 *
 * For any non-empty array of valid transactions:
 *  1. chart.data.labels contains exactly the active categories (those with total > 0)
 *  2. chart.data.datasets[0].data[i] equals the sum for chart.data.labels[i]
 *  3. chart.data.datasets[0].backgroundColor[i] equals CATEGORY_COLORS[chart.data.labels[i]]
 */
describe('Property 7: Chart data matches aggregated category totals', () => {
  test('renderChart sets labels, data, and colors matching per-category sums', () => {
    fc.assert(
      fc.property(
        fc.array(validTransactionArbitrary, { minLength: 1 }),
        (transactions) => {
          // 1. Set up a mock chart object with jest.fn() for update()
          const mockChart = {
            data: {
              labels: [],
              datasets: [{ data: [], backgroundColor: [] }],
            },
            update: jest.fn(),
          };

          // 2. Inject the mock chart and set transactions
          setChart(mockChart);
          setTransactions(transactions);

          // 3. Call renderChart()
          renderChart();

          // 4. Compute expected per-category sums from the generated transactions
          const expectedTotals = {};
          for (const cat of CATEGORIES) {
            expectedTotals[cat] = 0;
          }
          for (const tx of transactions) {
            if (expectedTotals[tx.category] !== undefined) {
              expectedTotals[tx.category] += tx.amount;
            }
          }

          // 5. Filter out categories with zero total
          const expectedActiveCategories = CATEGORIES.filter(
            (cat) => expectedTotals[cat] > 0
          );

          // 6. Assert chart.data.labels contains exactly the active categories
          expect(mockChart.data.labels).toEqual(expectedActiveCategories);

          // 7. Assert each data value equals the sum for the corresponding label
          mockChart.data.labels.forEach((label, i) => {
            expect(mockChart.data.datasets[0].data[i]).toBeCloseTo(
              expectedTotals[label],
              5
            );
          });

          // 8. Assert each background color equals CATEGORY_COLORS for the label
          mockChart.data.labels.forEach((label, i) => {
            expect(mockChart.data.datasets[0].backgroundColor[i]).toBe(
              CATEGORY_COLORS[label]
            );
          });

          // 9. Assert chart.update() was called (chart was actually updated)
          expect(mockChart.update).toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });
});
