# Requirements Document

## Introduction

The Expense & Budget Visualizer is a mobile-friendly, client-side web application that helps users track their daily spending. It provides an input form for logging transactions, a scrollable transaction history list, a live total balance display, and a pie chart visualizing spending distribution by category. The app runs entirely in the browser using HTML, CSS, and Vanilla JavaScript, with data persisted via the browser's Local Storage API — no backend or build tooling required.

## Glossary

- **App**: The Expense & Budget Visualizer web application
- **Transaction**: A single spending record consisting of an item name, a monetary amount, and a category
- **Category**: A classification label for a transaction; one of: Food, Transport, or Fun
- **Transaction_List**: The ordered collection of all transactions currently stored in Local Storage
- **Balance**: The sum of all transaction amounts in the Transaction_List
- **Chart**: The pie chart that visualizes spending distribution across categories
- **Form**: The input form used to create a new transaction
- **Local_Storage**: The browser's Web Storage API used to persist transaction data client-side

---

## Requirements

### Requirement 1: Transaction Input Form

**User Story:** As a user, I want to fill in a form with an item name, amount, and category so that I can log a new spending transaction.

#### Acceptance Criteria

1. THE Form SHALL contain an item name text field (maximum 100 characters), a numeric amount field, and a category selector with options: Food, Transport, and Fun.
2. WHEN a user submits the Form with all fields filled and a valid positive amount (greater than 0, up to 2 decimal places, not exceeding 999,999,999.99), THE App SHALL create a new Transaction and add it to the Transaction_List.
3. WHEN a user submits the Form with one or more empty fields, THE App SHALL prevent submission and display an inline validation error message identifying the missing field(s).
4. WHEN a user submits the Form with an amount that is not a positive number (zero, negative, non-numeric, or exceeding the maximum), THE App SHALL prevent submission and display an inline validation error indicating the amount must be a positive number up to 999,999,999.99.
5. WHEN a Transaction is successfully added, THE Form SHALL reset the item name field to empty, the amount field to empty, and the category selector to its first option (Food).

---

### Requirement 2: Transaction List Display

**User Story:** As a user, I want to see a scrollable list of all my transactions so that I can review my spending history.

#### Acceptance Criteria

1. THE App SHALL always display the Transaction_List container.
2. IF the Transaction_List is empty (on initial load or after all transactions are deleted), THEN THE App SHALL display a placeholder message (e.g., "No transactions yet") inside the Transaction_List container.
3. THE App SHALL display each Transaction in the Transaction_List showing the item name, amount formatted to two decimal places with a currency symbol (e.g., $12.50), and category, ordered with the most recently added transaction first.
4. WHEN the Transaction_List contains more items than the visible area, THE App SHALL allow the user to scroll through all items.
5. WHEN a user clicks the per-Transaction delete button, THE App SHALL remove that Transaction from the Transaction_List and update the display within 100 milliseconds.

---

### Requirement 3: Total Balance Display

**User Story:** As a user, I want to see my total spending balance at the top of the page so that I always know how much I have spent in total.

#### Acceptance Criteria

1. THE App SHALL display the Balance above the Transaction_List such that it is visible without scrolling on page load.
2. WHEN a Transaction is added to the Transaction_List, THE App SHALL recalculate the Balance as the sum of all Transaction amounts, formatted to two decimal places with a currency symbol (e.g., $0.00), and update the Balance display within 100 milliseconds.
3. WHEN a Transaction is deleted from the Transaction_List, THE App SHALL recalculate the Balance as the sum of all remaining Transaction amounts, formatted to two decimal places with a currency symbol, and update the Balance display within 100 milliseconds.
4. IF the Transaction_List is empty, THEN THE App SHALL display a Balance of $0.00.

---

### Requirement 4: Spending Category Chart

**User Story:** As a user, I want to see a pie chart of my spending by category so that I can understand where my money is going.

#### Acceptance Criteria

1. THE App SHALL render a pie chart (using Chart.js or an equivalent client-side chart library) where each slice represents a Category's share of total spending, calculated as the sum of amounts for that Category divided by the total Balance, and categories with a total amount of zero SHALL be excluded from the chart.
2. WHEN a Transaction is added to the Transaction_List, THE Chart SHALL update to reflect the new spending distribution within 100 milliseconds.
3. WHEN a Transaction is deleted from the Transaction_List, THE Chart SHALL update to reflect the revised spending distribution within 100 milliseconds.
4. IF the Transaction_List is empty, THEN THE Chart SHALL hide the pie chart canvas and display a text placeholder (e.g., "No data to display") in its place.
5. THE Chart SHALL display a legend identifying each Category with a fixed, distinct color: Food uses one color, Transport uses a second color, and Fun uses a third color; these colors SHALL remain consistent across all renders.

---

### Requirement 5: Data Persistence

**User Story:** As a user, I want my transactions to be saved between browser sessions so that I do not lose my spending history when I close or refresh the page.

#### Acceptance Criteria

1. WHEN a Transaction is added, THE App SHALL write the updated Transaction_List to Local_Storage within 100 milliseconds; IF the write fails (e.g., quota exceeded), THEN THE App SHALL display a non-blocking error message informing the user that the transaction could not be saved.
2. WHEN a Transaction is deleted, THE App SHALL write the updated Transaction_List to Local_Storage within 100 milliseconds; IF the write fails, THEN THE App SHALL display a non-blocking error message informing the user that the deletion could not be persisted.
3. WHEN the App loads in the browser, THE App SHALL read the Transaction_List from Local_Storage; IF individual Transaction records are malformed or fail validation, THEN THE App SHALL skip those records and restore only the valid Transactions.
4. IF Local_Storage is unavailable or returns a parse error on load, THEN THE App SHALL initialize with an empty Transaction_List and display a non-blocking warning message to the user.

---

### Requirement 6: Mobile-Friendly Responsive Layout

**User Story:** As a user on a mobile device, I want the app to be usable on a small screen so that I can log and review transactions on my phone.

#### Acceptance Criteria

1. THE App SHALL use a responsive layout that renders without horizontal scrolling or content overflow at any viewport width between 320px and 1440px.
2. THE Form fields and submit button SHALL each have a minimum tap target size of 44×44 CSS pixels.
3. THE App SHALL render and function correctly in the latest stable release of Chrome, Firefox, Edge, and Safari at the time of deployment.
4. THE App SHALL display all body text at a minimum font size of 14px and all labels and headings at a minimum font size of 16px.
5. THE App SHALL maintain a correct layout in both portrait and landscape orientations on mobile viewports (320px–767px width).

---

### Requirement 7: Performance and Load Time

**User Story:** As a user, I want the app to load quickly and respond without noticeable lag so that my experience is smooth.

#### Acceptance Criteria

1. THE App SHALL load and become fully interactive (all components rendered and accepting user input) in a modern browser within 3 seconds on a connection with a download speed of at least 10 Mbps.
2. WHEN a user adds or deletes a Transaction, THE App SHALL update the Balance display, Transaction_List display, and Chart — measured from the moment of user action to the corresponding DOM update — each within 100 milliseconds, for a Transaction_List containing up to 100 transactions.
