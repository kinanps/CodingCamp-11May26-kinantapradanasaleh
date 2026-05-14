# Implementation Plan: Expense & Budget Visualizer

## Overview

Implement a single-page, client-side web application using plain HTML, CSS, and Vanilla JavaScript. The app tracks daily spending with a transaction form, scrollable history list, live balance display, and a Chart.js pie chart. All state is persisted to `localStorage`. Tests are written with Jest (jsdom) and fast-check.

## Tasks

- [x] 1. Set up project structure and testing environment
  - Create `index.html`, `styles.css`, and `app.js` files in the project root
  - Create `jest.config.js` with `testEnvironment: 'jsdom'`
  - Create `package.json` with Jest and fast-check as dev dependencies (`jest@^29`, `fast-check@^3`, `jest-environment-jsdom@^29`)
  - Create `__tests__/` directory for test files
  - _Requirements: 6.1, 7.1_

- [x] 2. Implement data models, constants, and state module
  - [x] 2.1 Define `CATEGORIES`, `CATEGORY_COLORS` constants and the `transactions` array in `app.js`
    - Export `CATEGORIES = ['Food', 'Transport', 'Fun']` and `CATEGORY_COLORS` map
    - Initialize module-scoped `let transactions = []`
    - _Requirements: 1.1, 4.5_

- [x] 3. Implement localStorage persistence layer
  - [x] 3.1 Implement `saveToStorage()` and `loadFromStorage()` in `app.js`
    - `saveToStorage()`: wraps `localStorage.setItem` in try/catch; on error calls `showToast` with error message
    - `loadFromStorage()`: wraps `JSON.parse` in try/catch; filters malformed records; returns valid array or `[]` with warning toast on failure
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 3.2 Write property test for localStorage round-trip (Property 5)
    - **Property 5: LocalStorage round-trip preserves all valid transactions**
    - **Validates: Requirements 5.1, 5.2, 5.3**
    - Use `fc.array(validTransactionArbitrary)` to generate transaction arrays
    - Assert `loadFromStorage()` output deeply equals input after `saveToStorage()`

  - [x] 3.3 Write property test for malformed record filtering (Property 6)
    - **Property 6: Malformed records are skipped on load**
    - **Validates: Requirements 5.3**
    - Use `fc.array(fc.oneof(validTransactionArbitrary, malformedRecordArbitrary))`
    - Assert only valid records are returned by `loadFromStorage()`

- [x] 4. Implement form validation
  - [x] 4.1 Implement `validateForm({ itemName, amount, category })` in `app.js`
    - Returns `{ valid: boolean, errors: { itemName?, amount?, category? } }`
    - Enforces: non-empty trimmed `itemName` ≤ 100 chars; `amount` parseable float > 0, ≤ 999,999,999.99, ≤ 2 decimal places; `category` in `CATEGORIES`
    - _Requirements: 1.2, 1.3, 1.4_

  - [x] 4.2 Write property test for valid inputs accepted (Property 1 — validation side)
    - **Property 1: Valid transaction addition grows the list**
    - **Validates: Requirements 1.2, 2.3**
    - Use `fc.record` with valid field arbitraries; assert `validateForm` returns `valid: true`

  - [x] 4.3 Write property test for invalid inputs rejected without mutation (Property 2)
    - **Property 2: Invalid inputs are rejected without mutating state**
    - **Validates: Requirements 1.3, 1.4**
    - Use `fc.oneof` covering empty name, zero/negative/non-numeric amount, amount > max, amount with > 2 decimal places, invalid category
    - Assert `validateForm` returns `valid: false` and `transactions` array is unchanged

- [x] 5. Implement state mutation functions
  - [x] 5.1 Implement `addTransaction(data)` in `app.js`
    - Generates `id` via `crypto.randomUUID()` (fallback: `Date.now().toString()`)
    - Appends new Transaction object to `transactions`; calls `saveToStorage()` then `renderAll()`
    - _Requirements: 1.2, 3.2, 5.1_

  - [x] 5.2 Implement `deleteTransaction(id)` in `app.js`
    - Filters `transactions` to remove the item with matching `id`; calls `saveToStorage()` then `renderAll()`
    - Unknown `id` leaves array unchanged
    - _Requirements: 2.5, 3.3, 5.2_

  - [x] 5.3 Write property test for delete removes exactly the targeted transaction (Property 4)
    - **Property 4: Delete removes exactly the targeted transaction**
    - **Validates: Requirements 2.5, 3.3**
    - Use `fc.array(validTransactionArbitrary, { minLength: 1 })`, pick a random id from the array
    - Assert resulting array length is original − 1, all other items unchanged and in original order

- [~] 6. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement rendering functions
  - [x] 7.1 Implement `renderBalance()` in `app.js`
    - Sums all `transaction.amount` values; formats as `$X.XX` using `toFixed(2)`; sets `#balance-amount` textContent
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 7.2 Write property test for balance equals sum of amounts (Property 3)
    - **Property 3: Balance equals sum of all transaction amounts**
    - **Validates: Requirements 3.2, 3.3, 3.4**
    - Use `fc.array(validTransactionArbitrary, { minLength: 0, maxLength: 100 })`
    - Assert rendered balance text equals `'$' + sum.toFixed(2)`

  - [x] 7.3 Implement `renderList()` in `app.js`
    - Clears `#transaction-list`; shows placeholder `<li>` when empty; otherwise renders newest-first `<li>` items with item name, formatted amount, category, and delete button
    - Delete button click handler calls `deleteTransaction(id)`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 7.4 Implement `renderChart()` in `app.js`
    - Aggregates totals per category; filters zero-total categories; hides `<canvas>` and shows placeholder when no data; otherwise updates `chart.data` and calls `chart.update()`
    - Wraps Chart.js errors in try/catch; degrades to placeholder on failure
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 7.5 Write property test for chart data matches aggregated category totals (Property 7)
    - **Property 7: Chart data matches aggregated category totals**
    - **Validates: Requirements 4.1, 4.5**
    - Use `fc.array(validTransactionArbitrary, { minLength: 1 })`
    - Assert chart labels, data values, and colors match per-category sums and `CATEGORY_COLORS`

  - [x] 7.6 Implement `renderAll()` in `app.js`
    - Calls `renderBalance()`, `renderList()`, `renderChart()` in sequence
    - _Requirements: 3.2, 3.3, 4.2, 4.3_

- [x] 8. Implement UI helpers and form wiring
  - [x] 8.1 Implement `showToast(message, type)`, `showValidationErrors(errors)`, and `clearValidationErrors()` in `app.js`
    - `showToast`: injects `<div class="toast toast--{type}">` into `#toast-container`; auto-removes after 4 s
    - `showValidationErrors`: populates `<span class="error">` elements for each field error
    - `clearValidationErrors`: clears all `<span class="error">` elements
    - _Requirements: 1.3, 1.4, 5.1, 5.2, 5.4_

  - [x] 8.2 Implement `handleFormSubmit(event)` and wire to form `submit` event in `app.js`
    - Calls `preventDefault()`; reads field values; calls `validateForm()`; on failure calls `showValidationErrors()`; on success calls `addTransaction()` then `form.reset()`
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

  - [x] 8.3 Write property test for form reset after successful submission (Property 8)
    - **Property 8: Form reset after successful submission**
    - **Validates: Requirements 1.5**
    - Use `fc.record(validTransactionFields)` to generate valid inputs
    - Assert item name, amount, and category fields are reset to initial state after `handleFormSubmit` succeeds

- [x] 9. Build the HTML structure and CSS layout
  - [x] 9.1 Write `index.html` with all four UI regions and Chart.js CDN script tag
    - Include `#transaction-form`, `#balance-display`, `#transaction-list-section`, `#chart-section`, and `#toast-container`
    - Load Chart.js from CDN before `app.js`; use `<script src="app.js" type="module">`
    - Add `aria-live` attributes on validation error spans and toast container
    - _Requirements: 1.1, 2.1, 3.1, 4.4, 6.2, 6.4_

  - [x] 9.2 Write `styles.css` with responsive layout
    - Implement single-column mobile layout (320 px) scaling to wider layout (up to 1440 px) using CSS Grid or Flexbox
    - Ensure form fields and submit button have minimum tap target of 44×44 CSS px
    - Set body text ≥ 14 px and labels/headings ≥ 16 px
    - Ensure no horizontal overflow at any viewport width 320 px–1440 px
    - _Requirements: 6.1, 6.2, 6.4, 6.5_

- [x] 10. Implement `init()` bootstrap and wire everything together
  - [x] 10.1 Implement `init()` in `app.js` and call it on `DOMContentLoaded`
    - Calls `loadFromStorage()` to populate `transactions`
    - Initializes the Chart.js instance on `#spending-chart` canvas
    - Attaches `handleFormSubmit` to the form `submit` event
    - Calls `renderAll()` to paint initial state
    - _Requirements: 2.2, 3.4, 4.4, 5.3, 5.4_

  - [x] 10.2 Write integration smoke tests
    - Assert all four UI regions are present in the DOM after `init()`
    - Assert adding a transaction updates balance text, list items, and chart data
    - Assert deleting the last transaction shows placeholders and `$0.00` balance
    - _Requirements: 2.2, 3.4, 4.4_

- [~] 11. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (Properties 1–8 from the design document)
- Unit tests validate specific examples and edge cases
- All property tests use fast-check with a minimum of 100 iterations per property
- The app uses no build tooling; Jest runs against the extracted pure/near-pure functions

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1"] },
    { "id": 1, "tasks": ["3.1", "4.1"] },
    { "id": 2, "tasks": ["3.2", "3.3", "4.2", "4.3", "5.1", "5.2"] },
    { "id": 3, "tasks": ["5.3", "7.1", "7.3", "7.4"] },
    { "id": 4, "tasks": ["7.2", "7.5", "7.6", "8.1"] },
    { "id": 5, "tasks": ["8.2", "9.1", "9.2"] },
    { "id": 6, "tasks": ["8.3", "10.1"] },
    { "id": 7, "tasks": ["10.2"] }
  ]
}
```
