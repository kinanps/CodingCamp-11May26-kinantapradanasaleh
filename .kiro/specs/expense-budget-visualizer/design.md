# Design Document: Expense & Budget Visualizer

## Overview

The Expense & Budget Visualizer is a single-page, client-side web application built with plain HTML, CSS, and Vanilla JavaScript — no build tooling, no backend, no framework. All state lives in memory during a session and is persisted to the browser's `localStorage` API between sessions.

The app has four primary UI regions:
1. **Transaction Input Form** — captures item name, amount, and category
2. **Total Balance Display** — shows the running sum of all transactions
3. **Spending Category Chart** — a Chart.js pie chart showing per-category distribution
4. **Transaction List** — a scrollable, newest-first history of all transactions with per-item delete

All four regions update synchronously within 100 ms of any add or delete action, driven by a central state management pattern: a single in-memory array of transactions that is the single source of truth, with all UI components re-rendered from that array on every mutation.

### Key Design Decisions

- **No framework**: keeps the bundle minimal and load time well under 3 s on 10 Mbps. Chart.js is the only external dependency, loaded via CDN.
- **Single source of truth**: one `transactions` array in a module-scoped variable; all UI reads from it, all mutations go through two functions (`addTransaction`, `deleteTransaction`).
- **Synchronous render pipeline**: every mutation calls `saveToStorage()` then `renderAll()`. No async rendering paths means the 100 ms budget is easy to meet for ≤ 100 items.
- **Chart.js for the pie chart**: mature, well-documented, CDN-available, supports dynamic updates via `chart.data` mutation + `chart.update()`.

---

## Architecture

The app is a single HTML file (`index.html`) that loads one CSS file (`styles.css`) and one JavaScript module (`app.js`). Chart.js is loaded from a CDN `<script>` tag before `app.js`.

```
index.html
├── <link> styles.css
├── <script src="https://cdn.jsdelivr.net/npm/chart.js"> (CDN)
└── <script src="app.js" type="module">
```

### Data Flow

```
User Action (submit form / click delete)
        │
        ▼
  Mutation Function
  addTransaction() / deleteTransaction()
        │
        ├──► saveToStorage()   ──► localStorage.setItem(...)
        │         │ on error
        │         └──► showToast(error)
        │
        └──► renderAll()
               ├──► renderBalance()
               ├──► renderList()
               └──► renderChart()
```

### Module Structure (`app.js`)

| Layer | Responsibility |
|---|---|
| **State** | `transactions[]` array, `CATEGORIES` constant |
| **Storage** | `loadFromStorage()`, `saveToStorage()` |
| **Validation** | `validateForm(formData)` → `{ valid, errors }` |
| **Mutations** | `addTransaction(data)`, `deleteTransaction(id)` |
| **Rendering** | `renderBalance()`, `renderList()`, `renderChart()`, `renderAll()` |
| **UI Helpers** | `showToast(msg, type)`, `showValidationErrors(errors)`, `clearValidationErrors()` |
| **Bootstrap** | `init()` — called on `DOMContentLoaded` |

---

## Components and Interfaces

### 1. Transaction Input Form

**HTML structure:**
```html
<form id="transaction-form">
  <div class="field-group">
    <label for="item-name">Item Name</label>
    <input id="item-name" type="text" maxlength="100" required />
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
```

**JavaScript interface:**
```js
// Called on form 'submit' event (after preventDefault)
function handleFormSubmit(event) { ... }

// Returns { valid: boolean, errors: { itemName?, amount?, category? } }
function validateForm({ itemName, amount, category }) { ... }
```

**Validation rules (enforced in `validateForm`):**
- `itemName`: non-empty after trim, ≤ 100 characters
- `amount`: parseable as a float, > 0, ≤ 999,999,999.99, ≤ 2 decimal places
- `category`: one of `['Food', 'Transport', 'Fun']`

On success: calls `addTransaction(data)`, then resets the form via `form.reset()`.  
On failure: calls `showValidationErrors(errors)` — populates the `<span class="error">` elements inline.

### 2. Transaction List

**HTML structure:**
```html
<section id="transaction-list-section">
  <h2>Transactions</h2>
  <ul id="transaction-list">
    <!-- populated by renderList() -->
  </ul>
</section>
```

**`renderList()` logic:**
- Clears `#transaction-list` innerHTML
- If `transactions.length === 0`: inserts `<li class="placeholder">No transactions yet</li>`
- Otherwise: iterates `[...transactions].reverse()` (newest-first), creates one `<li>` per transaction:
  ```html
  <li data-id="<uuid>">
    <span class="item-name">Lunch</span>
    <span class="amount">$12.50</span>
    <span class="category">Food</span>
    <button class="delete-btn" aria-label="Delete Lunch">×</button>
  </li>
  ```
- Delete button click handler calls `deleteTransaction(id)`.

### 3. Total Balance Display

**HTML structure:**
```html
<div id="balance-display">
  <span class="balance-label">Total Balance</span>
  <span id="balance-amount">$0.00</span>
</div>
```

**`renderBalance()` logic:**
- Sums all `transaction.amount` values
- Formats with `toFixed(2)` and `$` prefix
- Sets `#balance-amount` textContent

### 4. Spending Category Chart

**HTML structure:**
```html
<section id="chart-section">
  <h2>Spending by Category</h2>
  <canvas id="spending-chart"></canvas>
  <p id="chart-placeholder" class="placeholder">No data to display</p>
</section>
```

**Chart.js configuration:**
```js
const CATEGORY_COLORS = {
  Food:      '#FF6384',
  Transport: '#36A2EB',
  Fun:       '#FFCE56',
};

// Initialized once in init()
const chart = new Chart(ctx, {
  type: 'pie',
  data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
  options: { responsive: true, plugins: { legend: { position: 'bottom' } } },
});
```

**`renderChart()` logic:**
- Aggregates totals per category from `transactions`
- Filters out categories with total = 0
- If no categories remain: hides `<canvas>`, shows `#chart-placeholder`
- Otherwise: shows `<canvas>`, hides placeholder, updates `chart.data.labels`, `chart.data.datasets[0].data`, `chart.data.datasets[0].backgroundColor` using `CATEGORY_COLORS`, calls `chart.update()`

### 5. Toast Notification

**HTML structure (injected by JS):**
```html
<div id="toast-container" aria-live="assertive" aria-atomic="true"></div>
```

**`showToast(message, type)` logic:**
- Creates a `<div class="toast toast--{type}">` element
- Appends to `#toast-container`
- Auto-removes after 4 seconds
- `type` is `'error'` or `'warning'`

---

## Data Models

### Transaction Object

```js
/**
 * @typedef {Object} Transaction
 * @property {string}  id        - UUID (crypto.randomUUID() or Date.now() fallback)
 * @property {string}  itemName  - User-provided item name (1–100 chars, trimmed)
 * @property {number}  amount    - Positive float, ≤ 999,999,999.99, ≤ 2 decimal places
 * @property {string}  category  - One of: 'Food' | 'Transport' | 'Fun'
 * @property {number}  createdAt - Unix timestamp (Date.now()) for ordering
 */
```

### LocalStorage Schema

- **Key**: `'expense-budget-visualizer-transactions'`
- **Value**: JSON-serialized array of Transaction objects

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "itemName": "Lunch",
    "amount": 12.50,
    "category": "Food",
    "createdAt": 1700000000000
  }
]
```

**Load-time validation** (in `loadFromStorage()`):
- Wraps `JSON.parse` in try/catch; on error → empty array + warning toast
- Filters each record: must have `id` (string), `itemName` (non-empty string), `amount` (positive finite number), `category` (valid enum value), `createdAt` (number). Malformed records are silently skipped.

### Category Constants

```js
const CATEGORIES = ['Food', 'Transport', 'Fun'];

const CATEGORY_COLORS = {
  Food:      '#FF6384',
  Transport: '#36A2EB',
  Fun:       '#FFCE56',
};
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Valid transaction addition grows the list

*For any* transaction list state and any valid transaction input (non-empty item name ≤ 100 chars, positive amount ≤ 999,999,999.99 with ≤ 2 decimal places, valid category), calling `addTransaction` SHALL result in the transaction list length increasing by exactly 1.

**Validates: Requirements 1.2, 2.3**

---

### Property 2: Invalid inputs are rejected without mutating state

*For any* transaction list state and any invalid form input (empty fields, zero/negative/non-numeric amount, amount exceeding maximum, or amount with more than 2 decimal places), the `validateForm` function SHALL return `valid: false` and the transaction list SHALL remain unchanged.

**Validates: Requirements 1.3, 1.4**

---

### Property 3: Balance equals sum of all transaction amounts

*For any* transaction list (including the empty list), the value rendered by `renderBalance()` SHALL equal the arithmetic sum of all `amount` fields in the list, formatted to exactly 2 decimal places with a `$` prefix.

**Validates: Requirements 3.2, 3.3, 3.4**

---

### Property 4: Delete removes exactly the targeted transaction

*For any* transaction list containing at least one transaction, deleting a transaction by its `id` SHALL result in a list that contains every original transaction except the one with that `id`, with all other transactions unchanged and in their original relative order.

**Validates: Requirements 2.5, 3.3**

---

### Property 5: LocalStorage round-trip preserves all valid transactions

*For any* array of valid Transaction objects, serializing it to LocalStorage via `saveToStorage()` and then deserializing it via `loadFromStorage()` SHALL produce an array that is deeply equal to the original (same items, same order, same field values).

**Validates: Requirements 5.1, 5.2, 5.3**

---

### Property 6: Malformed records are skipped on load

*For any* LocalStorage payload that is a JSON array mixing valid Transaction objects with malformed records (missing fields, wrong types, invalid category, non-positive amount), `loadFromStorage()` SHALL return only the valid Transaction objects and silently discard the malformed ones.

**Validates: Requirements 5.3**

---

### Property 7: Chart data matches aggregated category totals

*For any* non-empty transaction list, the data passed to the Chart.js instance by `renderChart()` SHALL contain exactly one entry per category that has a non-zero total, with each entry's value equal to the sum of `amount` for all transactions in that category, and each entry's color equal to the fixed color defined in `CATEGORY_COLORS` for that category.

**Validates: Requirements 4.1, 4.5**

---

### Property 8: Form reset after successful submission

*For any* valid form submission that results in a transaction being added, the form's item name field, amount field, and category selector SHALL be reset to their initial/empty state immediately after the transaction is added.

**Validates: Requirements 1.5**

---

## Error Handling

### Validation Errors (Form)

- Detected synchronously in `validateForm()` before any state mutation
- Displayed inline next to the offending field via `<span class="error">` elements
- Cleared on the next successful submission or when the user corrects the field
- Form submission is blocked; no state change occurs

### LocalStorage Write Failure

- `saveToStorage()` wraps `localStorage.setItem()` in a try/catch
- On `QuotaExceededError` or any other storage error: the in-memory state is already updated (the transaction was added/deleted successfully in memory), but a non-blocking error toast is shown: *"Your transaction could not be saved. Storage may be full."*
- The app continues to function for the current session

### LocalStorage Read Failure (on load)

- `loadFromStorage()` wraps `JSON.parse` in a try/catch
- If `localStorage` is unavailable (throws on access): initializes `transactions = []`, shows warning toast: *"Could not load saved transactions. Storage is unavailable."*
- If `JSON.parse` fails (corrupted data): initializes `transactions = []`, shows warning toast: *"Saved data could not be read and has been reset."*
- Malformed individual records are filtered out silently (no toast per record)

### Chart Rendering

- If `transactions` is empty: `renderChart()` hides the `<canvas>` and shows the placeholder — no Chart.js call is made
- Chart.js errors (unlikely with controlled data) are caught and logged to console; the chart section degrades gracefully to the placeholder state

---

## Testing Strategy

### Overview

This feature is a client-side Vanilla JS app with no build tooling. Testing uses **Jest** (with jsdom) for unit and property-based tests, and **fast-check** as the property-based testing library. No end-to-end framework is required for the correctness properties — all testable logic is pure or near-pure functions that can be exercised in jsdom.

### Unit Tests

Unit tests cover specific examples, edge cases, and integration points:

**Validation (`validateForm`)**
- Accepts a valid transaction (all fields correct)
- Rejects empty item name
- Rejects whitespace-only item name
- Rejects item name > 100 characters
- Rejects amount = 0
- Rejects negative amount
- Rejects amount > 999,999,999.99
- Rejects amount with 3 decimal places (e.g., `1.001`)
- Rejects non-numeric amount string
- Rejects invalid category value

**State mutations**
- `addTransaction` appends to the array with correct fields
- `deleteTransaction` removes the correct item by id
- `deleteTransaction` with unknown id leaves array unchanged

**Balance calculation**
- Empty list → `$0.00`
- Single item → correct formatted value
- Multiple items → correct sum

**LocalStorage**
- `saveToStorage` serializes correctly
- `loadFromStorage` deserializes correctly
- `loadFromStorage` skips malformed records
- `loadFromStorage` returns empty array on parse error

**Chart data aggregation**
- Zero-amount categories excluded
- Correct totals per category
- Correct colors from `CATEGORY_COLORS`

### Property-Based Tests

Property-based tests use **fast-check** with a minimum of **100 iterations** per property. Each test is tagged with a comment referencing the design property it validates.

**Property test configuration:**
```js
// jest.config.js
module.exports = { testEnvironment: 'jsdom' };

// In each property test file:
import fc from 'fast-check';
// Feature: expense-budget-visualizer, Property N: <property text>
```

**Property tests to implement:**

| # | Design Property | fast-check Arbitraries |
|---|---|---|
| 1 | Valid transaction addition grows the list | `fc.array(validTransaction)`, `fc.record(validTransactionFields)` |
| 2 | Invalid inputs rejected without mutation | `fc.oneof(emptyString, negativeAmount, excessiveAmount, badCategory, ...)` |
| 3 | Balance equals sum of amounts | `fc.array(validTransaction, { minLength: 0, maxLength: 100 })` |
| 4 | Delete removes exactly the targeted transaction | `fc.array(validTransaction, { minLength: 1 })`, pick random id |
| 5 | LocalStorage round-trip preserves valid transactions | `fc.array(validTransaction)` |
| 6 | Malformed records skipped on load | `fc.array(fc.oneof(validTransaction, malformedRecord))` |
| 7 | Chart data matches aggregated category totals | `fc.array(validTransaction, { minLength: 1 })` |
| 8 | Form reset after successful submission | `fc.record(validTransactionFields)` |

### Integration / Smoke Tests

- App loads without JS errors in jsdom
- All four UI regions are present in the DOM after `init()`
- Adding a transaction updates all three display regions (balance, list, chart)
- Deleting the last transaction shows placeholders in list and chart, balance shows `$0.00`

### Accessibility and Responsive Layout

- Verified manually: tap targets ≥ 44×44 px, font sizes, no horizontal overflow at 320 px
- Cross-browser smoke test: load in Chrome, Firefox, Edge, Safari and verify no console errors
- Screen reader: `aria-live` regions on validation errors and toast notifications
