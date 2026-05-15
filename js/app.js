/**
 * Expense & Budget Visualizer
 * app.js — main application module
 */

// ============================================================
// Constants (Task 2.1 — Requirements 1.1, 4.5)
// ============================================================

/** The three supported spending categories. */
export const CATEGORIES = ['Food', 'Transport', 'Fun'];

/**
 * Fixed, distinct colors for each category used in the pie chart.
 * These colors remain consistent across all renders.
 */
export const CATEGORY_COLORS = {
  Food:      '#FF6384',
  Transport: '#36A2EB',
  Fun:       '#FFCE56',
};

export const CATEGORY_STORAGE_KEY = 'expense-budget-visualizer-categories';

export function loadCategories() {
  try {
    const raw = localStorage.getItem(CATEGORY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach(c => {
          if (c.name && c.color && !CATEGORIES.includes(c.name)) {
            CATEGORIES.push(c.name);
            CATEGORY_COLORS[c.name] = c.color;
          }
        });
      }
    }
  } catch (err) {}
  renderCategoryOptions();
}

export function saveCategories() {
  const custom = [];
  // Skip the 3 default categories
  for (let i = 3; i < CATEGORIES.length; i++) {
    const name = CATEGORIES[i];
    custom.push({ name, color: CATEGORY_COLORS[name] });
  }
  try {
    localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(custom));
  } catch (err) {}
}

export function addCustomCategory(name) {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 20) {
    return { valid: false, error: 'Name must be 1-20 characters' };
  }
  
  const exists = CATEGORIES.find(c => c.toLowerCase() === trimmed.toLowerCase());
  if (exists) {
    return { valid: false, error: 'Category already exists' };
  }
  
  const colors = ['#9C27B0', '#00BCD4', '#8BC34A', '#FF9800', '#795548', '#607D8B', '#E91E63', '#3F51B5'];
  const color = colors[(CATEGORIES.length - 3) % colors.length];
  
  CATEGORIES.push(trimmed);
  CATEGORY_COLORS[trimmed] = color;
  
  saveCategories();
  renderCategoryOptions();
  
  return { valid: true, name: trimmed };
}

export function renderCategoryOptions() {
  const selectForm = document.getElementById('category');
  if (selectForm) {
    const currentVal = selectForm.value;
    selectForm.innerHTML = '';
    CATEGORIES.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      selectForm.appendChild(opt);
    });
    if (CATEGORIES.includes(currentVal)) {
      selectForm.value = currentVal;
    } else {
      selectForm.value = CATEGORIES[0];
    }
  }
}

export function initCategoryUI() {
  const btnShowAdd = document.getElementById('btn-show-add-category');
  const btnAdd = document.getElementById('btn-add-category');
  const btnCancel = document.getElementById('btn-cancel-category');
  const addGroup = document.getElementById('add-category-group');
  const inputNew = document.getElementById('new-category-name');
  const errorSpan = document.getElementById('error-new-category');
  
  if (!btnShowAdd) return;
  
  btnShowAdd.addEventListener('click', () => {
    addGroup.style.display = 'flex';
    inputNew.focus();
  });
  
  btnCancel.addEventListener('click', () => {
    addGroup.style.display = 'none';
    inputNew.value = '';
    if (errorSpan) errorSpan.textContent = '';
  });
  
  btnAdd.addEventListener('click', () => {
    const result = addCustomCategory(inputNew.value);
    if (result.valid) {
      addGroup.style.display = 'none';
      inputNew.value = '';
      if (errorSpan) errorSpan.textContent = '';
      document.getElementById('category').value = result.name;
    } else {
      if (errorSpan) errorSpan.textContent = result.error;
    }
  });
}

// ============================================================
// State (Task 2.1 — Requirements 1.1, 4.5)
// ============================================================

/**
 * Module-scoped in-memory array of Transaction objects.
 * This is the single source of truth for all UI rendering.
 *
 * @type {Array<{id: string, itemName: string, amount: number, category: string, createdAt: number}>}
 */
let transactions = [];
let currentSort = 'date-desc';

// Export a getter so tests can read the current state without
// directly mutating the module variable.
export function getTransactions() {
  return transactions;
}

// Export a setter so tests (and future functions) can replace
// the array (e.g. after loading from storage).
export function setTransactions(arr) {
  transactions = arr;
}

// ============================================================
// UI Helpers (Task 8.1 — Requirements 1.3, 1.4, 5.1, 5.2, 5.4)
// ============================================================

/**
 * Displays a non-blocking toast notification.
 *
 * Creates a `<div class="toast toast--{type}">` element, appends it
 * to `#toast-container`, and auto-removes it after 4 seconds.
 * Handles gracefully when `#toast-container` doesn't exist.
 *
 * @param {string} message - The text to display.
 * @param {'error'|'warning'} [type='error'] - Visual style.
 */
export function showToast(message, type = 'error') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 4000);
}

/**
 * Populates inline `<span class="error">` elements for each field error.
 *
 * Field name mapping:
 *  - `itemName`  → `#error-item-name`
 *  - `amount`    → `#error-amount`
 *  - `category`  → `#error-category`
 *
 * Handles gracefully when elements don't exist.
 *
 * @param {{ itemName?: string, amount?: string, category?: string }} errors
 */
export function showValidationErrors(errors) {
  const fieldMap = {
    itemName: 'error-item-name',
    amount:   'error-amount',
    category: 'error-category',
  };

  for (const [field, elementId] of Object.entries(fieldMap)) {
    const el = document.getElementById(elementId);
    if (el && errors[field]) {
      el.textContent = errors[field];
    }
  }
}

/**
 * Clears all inline validation error spans.
 *
 * Specifically clears `#error-item-name`, `#error-amount`, and
 * `#error-category` by setting their textContent to an empty string.
 * Handles gracefully when elements don't exist.
 */
export function clearValidationErrors() {
  const ids = ['error-item-name', 'error-amount', 'error-category'];
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = '';
    }
  }
}

// ============================================================
// LocalStorage Persistence (Task 3.1 — Requirements 5.1–5.4)
// ============================================================

/** The key used to store transactions in localStorage. */
export const STORAGE_KEY = 'expense-budget-visualizer-transactions';

/**
 * Serializes the current in-memory `transactions` array to
 * localStorage.  On any storage error (e.g. QuotaExceededError)
 * a non-blocking error toast is shown and the function returns
 * without throwing.
 *
 * Requirements: 5.1, 5.2
 */
export function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (err) {
    showToast(
      'Your transaction could not be saved. Storage may be full.',
      'error'
    );
  }
}

/**
 * Reads and deserializes the transactions array from localStorage.
 * Malformed individual records are silently filtered out.
 *
 * Returns an empty array (and shows a warning toast) when:
 *  - localStorage is unavailable / throws on access
 *  - the stored value cannot be parsed as JSON
 *
 * Requirements: 5.3, 5.4
 *
 * @returns {Array<{id: string, itemName: string, amount: number, category: string, createdAt: number}>}
 */
export function loadFromStorage() {
  let raw;

  // Guard against environments where localStorage itself throws
  // (e.g. private-browsing restrictions, security policies).
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch (err) {
    showToast(
      'Could not load saved transactions. Storage is unavailable.',
      'warning'
    );
    return [];
  }

  // Nothing stored yet — return empty array without a toast.
  if (raw === null) {
    return [];
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    showToast(
      'Saved data could not be read and has been reset.',
      'warning'
    );
    return [];
  }

  // Ensure the top-level value is an array.
  if (!Array.isArray(parsed)) {
    showToast(
      'Saved data could not be read and has been reset.',
      'warning'
    );
    return [];
  }

  // Filter out any records that do not conform to the Transaction schema.
  return parsed.filter(isValidTransaction);
}

/**
 * Returns true when `record` satisfies the Transaction schema:
 *  - id: non-empty string
 *  - itemName: non-empty string
 *  - amount: positive finite number
 *  - category: one of CATEGORIES
 *  - createdAt: number
 *
 * @param {unknown} record
 * @returns {boolean}
 */
function isValidTransaction(record) {
  if (typeof record !== 'object' || record === null) return false;

  const { id, itemName, amount, category, createdAt } = record;

  if (typeof id !== 'string' || id.trim() === '') return false;
  if (typeof itemName !== 'string' || itemName.trim() === '') return false;
  if (typeof amount !== 'number' || !isFinite(amount) || amount <= 0) return false;
  if (!CATEGORIES.includes(category)) return false;
  if (typeof createdAt !== 'number') return false;

  return true;
}

// ============================================================
// Chart instance (Task 7.4 — Requirements 4.1–4.5)
// ============================================================

/**
 * Module-scoped Chart.js instance.  Initialized in init(); updated
 * by renderChart() on every mutation.
 *
 * @type {object|null}
 */
let chart = null;

/**
 * Replaces the module-scoped chart instance.
 * Exported so that tests can inject a mock chart object without
 * needing to call init() or touch the real Chart.js constructor.
 *
 * @param {object|null} instance
 */
export function setChart(instance) {
  chart = instance;
}

// ============================================================
// Rendering (Task 7 — Requirements 3.1–3.4, 2.1–2.5, 4.1–4.5)
// ============================================================

/**
 * Calculates the sum of all transaction amounts and updates the
 * #balance-amount element with the formatted value.
 *
 * - Sums all `transaction.amount` values (empty list → 0)
 * - Formats as '$X.XX' using toFixed(2)
 * - Sets #balance-amount textContent
 * - Handles gracefully when the element doesn't exist (e.g. in tests)
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */
export function renderBalance() {
  const total = transactions.reduce((sum, t) => sum + t.amount, 0);
  const formatted = '$' + total.toFixed(2);

  const el = document.getElementById('balance-amount');
  if (el) {
    el.textContent = formatted;
  }

  return formatted;
}

/**
 * Renders the spending-by-category pie chart.
 *
 * Logic:
 *  1. Aggregate total amounts per category from `transactions`.
 *  2. Filter out categories whose total is 0.
 *  3. If no categories remain (empty or all-zero):
 *       - hide <canvas id="spending-chart">
 *       - show  #chart-placeholder
 *  4. Otherwise:
 *       - show <canvas>, hide placeholder
 *       - update chart.data.labels, chart.data.datasets[0].data,
 *         chart.data.datasets[0].backgroundColor
 *       - call chart.update()
 *  5. Wraps Chart.js calls in try/catch; on error degrades to
 *     placeholder state.
 *  6. Null-checks all DOM elements so the function is safe in
 *     test environments that don't have the full HTML.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
export function renderChart() {
  const canvas = document.getElementById('spending-chart');
  const placeholder = document.getElementById('chart-placeholder');

  // Helper: degrade to placeholder state
  function showPlaceholder() {
    if (canvas) canvas.style.display = 'none';
    if (placeholder) placeholder.style.display = '';
  }

  // Aggregate totals per category
  const totals = {};
  for (const cat of CATEGORIES) {
    totals[cat] = 0;
  }
  for (const tx of transactions) {
    if (totals[tx.category] !== undefined) {
      totals[tx.category] += tx.amount;
    }
  }

  // Filter out zero-total categories
  const activeCategories = CATEGORIES.filter(cat => totals[cat] > 0);

  if (activeCategories.length === 0) {
    showPlaceholder();
    return;
  }

  // Show canvas, hide placeholder
  if (canvas) canvas.style.display = '';
  if (placeholder) placeholder.style.display = 'none';

  // Update chart data and re-render
  if (!chart) return;

  try {
    chart.data.labels = activeCategories;
    chart.data.datasets[0].data = activeCategories.map(cat => totals[cat]);
    chart.data.datasets[0].backgroundColor = activeCategories.map(
      cat => CATEGORY_COLORS[cat]
    );
    chart.update();
  } catch (err) {
    // Chart.js error — degrade gracefully to placeholder
    showPlaceholder();
  }
}

/**
 * Re-renders the `#transaction-list` element from the current
 * in-memory `transactions` array.
 *
 * Behaviour:
 *  - Clears the list's innerHTML on every call.
 *  - If `transactions` is empty, inserts a single placeholder item.
 *  - Otherwise iterates a reversed copy of the array (newest-first)
 *    and creates one `<li>` per transaction containing:
 *      - `.item-name` span
 *      - `.amount` span formatted as `$X.XX`
 *      - `.category` span
 *      - `.delete-btn` button whose click calls `deleteTransaction(id)`
 *  - Gracefully handles a missing `#transaction-list` element (null check).
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
export function renderList() {
  const list = document.getElementById('transaction-list');

  // Guard: element may not exist in test environments or before DOM is ready.
  if (!list) return;

  // Clear existing content.
  list.innerHTML = '';

  if (transactions.length === 0) {
    const placeholder = document.createElement('li');
    placeholder.className = 'placeholder';
    placeholder.textContent = 'No transactions yet';
    list.appendChild(placeholder);
    return;
  }

  // Render according to current sort without mutating the original array.
  let displayList = [...transactions];
  displayList.sort((a, b) => {
    switch (currentSort) {
      case 'date-asc':
        return a.createdAt - b.createdAt;
      case 'amount-desc':
        return b.amount - a.amount;
      case 'amount-asc':
        return a.amount - b.amount;
      case 'category':
        return a.category.localeCompare(b.category);
      case 'date-desc':
      default:
        return b.createdAt - a.createdAt;
    }
  });

  displayList.forEach((tx) => {
    const li = document.createElement('li');
    li.dataset.id = tx.id;

    const nameSpan = document.createElement('span');
    nameSpan.className = 'item-name';
    nameSpan.textContent = tx.itemName;

    const amountSpan = document.createElement('span');
    amountSpan.className = 'amount';
    amountSpan.textContent = '$' + tx.amount.toFixed(2);

    const categorySpan = document.createElement('span');
    categorySpan.className = 'category';
    categorySpan.textContent = tx.category;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.setAttribute('aria-label', 'Delete ' + tx.itemName);
    deleteBtn.textContent = '\u00d7';
    deleteBtn.addEventListener('click', () => {
      deleteTransaction(tx.id);
    });

    li.appendChild(nameSpan);
    li.appendChild(amountSpan);
    li.appendChild(categorySpan);
    li.appendChild(deleteBtn);

    list.appendChild(li);
  });
}

/**
 * Re-renders all UI regions (balance, list, chart).
 *
 * Requirements: 3.2, 3.3, 4.2, 4.3
 */
export function renderAll() {
  renderBalance();
  renderList();
  renderChart();
}

// ============================================================
// State Mutations (Task 5.1 — Requirements 1.2, 3.2, 5.1)
// ============================================================

/**
 * Creates a new Transaction from the provided data, appends it
 * to the in-memory `transactions` array, persists to storage,
 * and triggers a full UI re-render.
 *
 * @param {{ itemName: string, amount: string|number, category: string }} data
 */
export function addTransaction(data) {
  // Generate a unique id — prefer crypto.randomUUID() with a
  // Date.now() + random suffix fallback for environments that
  // don't support it (e.g. non-HTTPS contexts, older jsdom).
  let id;
  try {
    id = crypto.randomUUID();
  } catch (_) {
    id = Date.now().toString() + '-' + Math.random().toString(36).slice(2);
  }

  const transaction = {
    id,
    itemName: data.itemName,
    amount: parseFloat(data.amount),
    category: data.category,
    createdAt: Date.now(),
  };

  transactions = [...transactions, transaction];

  saveToStorage();
  renderAll();
}

// ============================================================
// State Mutations (Task 5.2 — Requirements 2.5, 3.3, 5.2)
// ============================================================

/**
 * Removes the transaction with the given `id` from the in-memory
 * `transactions` array, then persists the updated array to
 * localStorage and re-renders all UI regions.
 *
 * If no transaction with the given `id` exists, the array is left
 * unchanged (the filter naturally produces the same array).
 *
 * Requirements: 2.5, 3.3, 5.2
 *
 * @param {string} id - The UUID of the transaction to remove.
 */
export function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveToStorage();
  renderAll();
}

// ============================================================
// Form Submission Handler (Task 8.2 — Requirements 1.2, 1.3, 1.4, 1.5)
// ============================================================

/**
 * Handles the transaction form's `submit` event.
 *
 * Steps:
 *  1. Calls `event.preventDefault()` to suppress native form submission.
 *  2. Reads values from `#item-name`, `#amount`, and `#category` fields.
 *  3. Calls `clearValidationErrors()` to remove any previous inline errors.
 *  4. Calls `validateForm({ itemName, amount, category })`.
 *  5. If `result.valid === false`: calls `showValidationErrors(result.errors)` and returns.
 *  6. If `result.valid === true`: calls `addTransaction(...)` then resets the form.
 *
 * Wired to the form `submit` event in `init()` (Task 10.1).
 *
 * Requirements: 1.2, 1.3, 1.4, 1.5
 *
 * @param {Event} event - The DOM submit event.
 */
export function handleFormSubmit(event) {
  event.preventDefault();

  const itemName = (document.getElementById('item-name') || {}).value || '';
  const amount   = (document.getElementById('amount')    || {}).value || '';
  const category = (document.getElementById('category')  || {}).value || '';

  clearValidationErrors();

  const result = validateForm({ itemName, amount, category });

  if (!result.valid) {
    showValidationErrors(result.errors);
    return;
  }

  addTransaction({ itemName: itemName.trim(), amount, category });
  event.target.reset();
}

// ============================================================
// Theme Management
// ============================================================

export const THEME_STORAGE_KEY = 'expense-budget-visualizer-theme';

export function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  } catch (err) {
    // Ignore storage errors for theme
  }
  
  updateThemeIcon(newTheme);
  updateChartTheme();
}

export function initTheme() {
  let savedTheme = 'light';
  try {
    savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'light';
  } catch (err) {}
  
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  const toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleTheme);
  }
}

function updateThemeIcon(theme) {
  const toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    toggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
    toggleBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }
}

function updateChartTheme() {
  if (!chart) return;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#aaaaaa' : '#555';
  const borderColor = isDark ? '#252525' : '#fff';
  
  if (chart.options && chart.options.plugins && chart.options.plugins.legend) {
    if (!chart.options.plugins.legend.labels) {
      chart.options.plugins.legend.labels = {};
    }
    chart.options.plugins.legend.labels.color = textColor;
  }
  
  if (chart.data && chart.data.datasets && chart.data.datasets.length > 0) {
    chart.data.datasets[0].borderColor = borderColor;
  }
  
  chart.update();
}

// ============================================================
// Bootstrap (Task 10.1 — Requirements 2.2, 3.4, 4.4, 5.3, 5.4)
// ============================================================

/**
 * Initialises the application:
 *  1. Loads persisted transactions from localStorage.
 *  2. Creates the Chart.js pie-chart instance on #spending-chart.
 *  3. Wires the form submit event to handleFormSubmit.
 *  4. Calls renderAll() to paint the initial UI state.
 *
 * Called automatically on DOMContentLoaded.
 *
 * Requirements: 2.2, 3.4, 4.4, 5.3, 5.4
 */
export function init() {
  // Load custom categories first so loaded transactions pass validation
  loadCategories();
  initCategoryUI();

  // 1. Restore persisted transactions
  const loaded = loadFromStorage();
  setTransactions(loaded);

  // Initialize theme
  initTheme();

  // 2. Initialise Chart.js on the #spending-chart canvas
  // Use window.Chart explicitly because the UMD bundle registers Chart
  // as a global, and bare 'Chart' may not resolve inside an ES module.
  const canvas = document.getElementById('spending-chart');
  if (canvas && typeof window.Chart !== 'undefined') {
    try {
      const ctx = canvas.getContext('2d');
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const chartInstance = new window.Chart(ctx, {
        type: 'pie',
        data: {
          labels: [],
          datasets: [{ 
            data: [], 
            backgroundColor: [],
            borderColor: isDark ? '#252525' : '#fff',
            borderWidth: 2
          }],
        },
        options: {
          responsive: true,
          plugins: { 
            legend: { 
              position: 'bottom',
              labels: {
                color: isDark ? '#aaaaaa' : '#555'
              }
            } 
          },
        },
      });
      setChart(chartInstance);
    } catch (err) {
      // Chart.js unavailable or canvas unsupported — degrade gracefully
    }
  }

  // 3. Attach form submit handler
  const form = document.getElementById('transaction-form');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }

  // 4. Attach sort change handler
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      renderList();
    });
  }

  // 4. Paint initial state
  renderAll();
}

// Wire init() to DOMContentLoaded so it runs once the HTML is parsed.
document.addEventListener('DOMContentLoaded', init);

// ============================================================
// Validation (Task 4.1 — Requirements 1.2, 1.3, 1.4)
// ============================================================

/**
 * Validates the transaction form fields.
 *
 * @param {{ itemName: string, amount: string|number, category: string }} formData
 * @returns {{ valid: boolean, errors: { itemName?: string, amount?: string, category?: string } }}
 */
export function validateForm({ itemName, amount, category }) {
  const errors = {};

  // --- itemName validation ---
  const trimmedName = typeof itemName === 'string' ? itemName.trim() : '';
  if (trimmedName.length === 0) {
    errors.itemName = 'Item name is required.';
  } else if (trimmedName.length > 100) {
    errors.itemName = 'Item name must be 100 characters or fewer.';
  }

  // --- amount validation ---
  const amountStr = String(amount).trim();
  const parsed = parseFloat(amountStr);

  if (amountStr === '' || isNaN(parsed)) {
    errors.amount = 'Amount must be a valid number.';
  } else if (parsed <= 0) {
    errors.amount = 'Amount must be greater than 0.';
  } else if (parsed > 999_999_999.99) {
    errors.amount = 'Amount must not exceed 999,999,999.99.';
  } else {
    // Check for more than 2 decimal places.
    // Use the string representation to count decimal digits precisely.
    const dotIndex = amountStr.indexOf('.');
    if (dotIndex !== -1 && amountStr.length - dotIndex - 1 > 2) {
      errors.amount = 'Amount must have at most 2 decimal places.';
    }
  }

  // --- category validation ---
  if (!CATEGORIES.includes(category)) {
    errors.category = 'Category must be one of: ' + CATEGORIES.join(', ') + '.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
