/**
 * Unit tests for UI helper functions:
 *   showToast(message, type)
 *   showValidationErrors(errors)
 *   clearValidationErrors()
 *
 * Requirements: 1.3, 1.4, 5.1, 5.2, 5.4
 */

import { showToast, showValidationErrors, clearValidationErrors } from '../app.js';

// ─── DOM setup ───────────────────────────────────────────────────────────────

beforeEach(() => {
  // Reset the document body before each test
  document.body.innerHTML = `
    <div id="toast-container"></div>
    <span class="error" id="error-item-name"></span>
    <span class="error" id="error-amount"></span>
    <span class="error" id="error-category"></span>
  `;

  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

// ─── showToast ────────────────────────────────────────────────────────────────

describe('showToast', () => {
  test('creates a toast element inside #toast-container', () => {
    showToast('Something went wrong');

    const container = document.getElementById('toast-container');
    expect(container.children.length).toBe(1);
    expect(container.children[0].textContent).toBe('Something went wrong');
  });

  test('applies the "toast" base class', () => {
    showToast('Base class test');

    const toast = document.getElementById('toast-container').children[0];
    expect(toast.classList.contains('toast')).toBe(true);
  });

  test('applies "toast--error" class when type is "error"', () => {
    showToast('Error message', 'error');

    const toast = document.getElementById('toast-container').children[0];
    expect(toast.classList.contains('toast--error')).toBe(true);
  });

  test('applies "toast--warning" class when type is "warning"', () => {
    showToast('Warning message', 'warning');

    const toast = document.getElementById('toast-container').children[0];
    expect(toast.classList.contains('toast--warning')).toBe(true);
  });

  test('defaults to "toast--error" when no type is provided', () => {
    showToast('Default type');

    const toast = document.getElementById('toast-container').children[0];
    expect(toast.classList.contains('toast--error')).toBe(true);
    expect(toast.classList.contains('toast--warning')).toBe(false);
  });

  test('auto-removes the toast after 4 seconds', () => {
    showToast('Auto-remove test');

    const container = document.getElementById('toast-container');
    expect(container.children.length).toBe(1);

    jest.advanceTimersByTime(4000);

    expect(container.children.length).toBe(0);
  });

  test('toast is still present before 4 seconds elapse', () => {
    showToast('Still visible');

    const container = document.getElementById('toast-container');
    jest.advanceTimersByTime(3999);

    expect(container.children.length).toBe(1);
  });

  test('multiple toasts can coexist in the container', () => {
    showToast('First');
    showToast('Second');

    const container = document.getElementById('toast-container');
    expect(container.children.length).toBe(2);
  });

  test('each toast is removed independently after 4 seconds', () => {
    showToast('First');
    jest.advanceTimersByTime(2000);
    showToast('Second');

    const container = document.getElementById('toast-container');
    expect(container.children.length).toBe(2);

    // First toast's 4 s expires
    jest.advanceTimersByTime(2000);
    expect(container.children.length).toBe(1);
    expect(container.children[0].textContent).toBe('Second');

    // Second toast's 4 s expires
    jest.advanceTimersByTime(2000);
    expect(container.children.length).toBe(0);
  });

  test('does not throw when #toast-container does not exist', () => {
    document.body.innerHTML = ''; // remove container
    expect(() => showToast('No container')).not.toThrow();
  });
});

// ─── showValidationErrors ─────────────────────────────────────────────────────

describe('showValidationErrors', () => {
  test('populates #error-item-name with the itemName error', () => {
    showValidationErrors({ itemName: 'Item name is required.' });

    expect(document.getElementById('error-item-name').textContent)
      .toBe('Item name is required.');
  });

  test('populates #error-amount with the amount error', () => {
    showValidationErrors({ amount: 'Amount must be greater than 0.' });

    expect(document.getElementById('error-amount').textContent)
      .toBe('Amount must be greater than 0.');
  });

  test('populates #error-category with the category error', () => {
    showValidationErrors({ category: 'Category must be one of: Food, Transport, Fun.' });

    expect(document.getElementById('error-category').textContent)
      .toBe('Category must be one of: Food, Transport, Fun.');
  });

  test('populates multiple error spans at once', () => {
    showValidationErrors({
      itemName: 'Item name is required.',
      amount:   'Amount must be a valid number.',
    });

    expect(document.getElementById('error-item-name').textContent)
      .toBe('Item name is required.');
    expect(document.getElementById('error-amount').textContent)
      .toBe('Amount must be a valid number.');
    // category span should remain empty
    expect(document.getElementById('error-category').textContent).toBe('');
  });

  test('does not throw when error span elements do not exist', () => {
    document.body.innerHTML = ''; // remove all spans
    expect(() =>
      showValidationErrors({ itemName: 'Error', amount: 'Error', category: 'Error' })
    ).not.toThrow();
  });

  test('does not modify spans for fields not present in errors object', () => {
    // Pre-populate a span to verify it is not cleared
    document.getElementById('error-amount').textContent = 'Existing error';

    showValidationErrors({ itemName: 'Item name is required.' });

    // amount span should be untouched
    expect(document.getElementById('error-amount').textContent).toBe('Existing error');
  });
});

// ─── clearValidationErrors ────────────────────────────────────────────────────

describe('clearValidationErrors', () => {
  test('clears #error-item-name', () => {
    document.getElementById('error-item-name').textContent = 'Some error';
    clearValidationErrors();
    expect(document.getElementById('error-item-name').textContent).toBe('');
  });

  test('clears #error-amount', () => {
    document.getElementById('error-amount').textContent = 'Some error';
    clearValidationErrors();
    expect(document.getElementById('error-amount').textContent).toBe('');
  });

  test('clears #error-category', () => {
    document.getElementById('error-category').textContent = 'Some error';
    clearValidationErrors();
    expect(document.getElementById('error-category').textContent).toBe('');
  });

  test('clears all three error spans at once', () => {
    document.getElementById('error-item-name').textContent = 'Error 1';
    document.getElementById('error-amount').textContent = 'Error 2';
    document.getElementById('error-category').textContent = 'Error 3';

    clearValidationErrors();

    expect(document.getElementById('error-item-name').textContent).toBe('');
    expect(document.getElementById('error-amount').textContent).toBe('');
    expect(document.getElementById('error-category').textContent).toBe('');
  });

  test('does not throw when error span elements do not exist', () => {
    document.body.innerHTML = ''; // remove all spans
    expect(() => clearValidationErrors()).not.toThrow();
  });
});
