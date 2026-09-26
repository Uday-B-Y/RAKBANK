# Playwright Test Automation Framework Guidelines

This document serves as the foundational context and standard operating procedures for developing, maintaining, and executing end-to-end (E2E) tests within this repository.

---

## Core Guidelines & Principles

### 1. Zero Flaky Tests
- **Deterministic Waits:** Avoid static wait times like `page.waitForTimeout()`. Rely strictly on auto-waiting mechanisms, explicit assertions, and web-first assertions (`expect(locator).toBeVisible()`).
- **State Isolation:** Ensure each test is completely isolated and independent. Always use clean browser contexts or reset backend state before and after execution to prevent side effects across test runs.

### 2. Strict Hallucination Prevention
- **Code Accuracy:** Only reference existing API endpoints, UI elements, database schema fields, and library features that actually exist within the codebase or target application.
- **Verification:** Double-check Playwright API syntax against the official Playwright documentation before generating custom helpers or wrappers.

### 3. Use Realistic & Real Data
- **Real-World Scenarios:** Avoid dummy placeholder data like `"asdf"` or `"test1234"` whenever possible. Use production-like dataset standards or dynamic fixture generators (e.g., Faker.js) that produce valid names, emails, phone numbers, and addresses.
- **Backend Sync:** Align test data structure with realistic backend schemas to reflect true user interactions.

### 4. Utilize Playwright Standard Locators
- **User-Facing Locators:** Always prefer Playwright’s built-in, user-centric locators over fragile XPath or CSS selectors:
  - `page.getByRole('button', { name: 'Submit' })`
  - `page.getByLabel('Username')`
  - `page.getByPlaceholder('Search...')`
  - `page.getByText('Welcome back')`
  - `page.getByTestId('custom-element')` *(use as fallback when standard semantic locators are unavailable)*

---

## Execution & Resilience Configuration

### 5. Retry Failed Test Cases
Configure retries in `playwright.config.ts` to automatically re-evaluate failed tests and minimize transient network/environment issues:

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  // Retry 2 times on CI, and 1 time locally
  retries: process.env.CI ? 2 : 1,
});
```

### 6. Run Until Tests Pass (Resilient Execution)
- **Local Debugging / Flakiness Hunting:** Use Playwright’s `--repeat-each` or loop parameters during investigation to ensure tests pass consistently under repeated runs:
  ```bash
  npx playwright test --repeat-each=5
  ```
- Set appropriate timeouts for complex workflows without relaxing overall assertion standards.

---

## Reporting & Project Structure

### 7. Execution Reports
- **HTML Reporter:** Maintain standard HTML reporting configured for rich post-execution analysis (including trace logs, screenshots, and videos on failure):
  ```typescript
  // playwright.config.ts
  export default defineConfig({
    reporter: [
      ['html', { outputFolder: 'playwright-report', open: 'never' }],
      ['list']
    ],
    use: {
      trace: 'on-first-retry',
      screenshot: 'only-on-failure',
      video: 'retain-on-failure',
    },
  });
  ```

### 8. Maintain Consistent Folder Structure
All new tests, helpers, and configurations must follow the existing folder hierarchy strictly:

```text
root/
├── .github/              # CI/CD Workflows
├── tests/                # Test spec files
│   ├── e2e/              # End-to-end test scenarios
│   └── api/              # API specific tests
├── page-objects/         # Page Object Model (POM) classes
├── fixtures/             # Custom fixtures & seed data
├── utils/                # Helper functions & data generators
├── playwright.config.ts  # Playwright configuration file
└── context.md            # Framework context & standards
```