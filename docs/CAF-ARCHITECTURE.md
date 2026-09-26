# CAF Architecture — Component-Action-Fixture

## Overview

CAF is a layered architecture pattern for Playwright E2E tests that enforces strict separation of concerns. Each layer has a single responsibility and dependencies flow in one direction only.

```
┌─────────────────────────────────────────────────────────────┐
│  Tests (specs)                                              │
│  - Scenarios, test steps, assertions via expect()           │
│  - Import `test` from fixtures, NOT from @playwright/test   │
├─────────────────────────────────────────────────────────────┤
│  Fixtures                                                   │
│  - Wire pages → actions → assertions                        │
│  - Setup/teardown, auth, test data injection                │
│  - Block 3rd-party scripts via ThirdPartyBlocker            │
├─────────────────────────────────────────────────────────────┤
│  Actions                                                    │
│  - Business workflows (5-15 lines per method)               │
│  - Extend BaseAction, use runWithNetwork() for API sync     │
│  - Orchestrate page objects, never expose locators          │
├─────────────────────────────────────────────────────────────┤
│  Pages                                                      │
│  - Compose components, expose UI-level methods              │
│  - Extend BasePage, locator definitions                     │
│  - NO logic, NO assertions, NO waits                        │
├─────────────────────────────────────────────────────────────┤
│  Components                                                 │
│  - Reusable UI elements (forms, navbars, modals, grids)     │
│  - Extend BaseComponent, root locator binding               │
│  - Pure locators and simple interaction helpers              │
├─────────────────────────────────────────────────────────────┤
│  Core                                                       │
│  - BasePage, BaseAction, BaseComponent                      │
│  - NetworkWatcher, CIKeepAlive, ThirdPartyBlocker           │
│  - FallbackLocator, telemetry, selector lifecycle           │
└─────────────────────────────────────────────────────────────┘
```

## Layer Rules

### Tests (`tests/**/*.spec.ts`)
- **ALLOWED:** Call actions, call assertions, use `expect()`, use `test.step()`
- **FORBIDDEN:** Raw locators (`page.locator()`), `page.click()`, `page.fill()`, API calls, loops, waits

### Fixtures (`src/fixtures/*.fixture.ts`)
- **ALLOWED:** Instantiate pages/actions/assertions, inject test data, setup/teardown
- **FORBIDDEN:** Test logic, UI interactions, assertions

### Actions (`src/actions/**/*.actions.ts`)
- **ALLOWED:** Business flow orchestration (5-15 lines/method), `runWithNetwork()`, `safeFill()`
- **FORBIDDEN:** Exposing locators, direct `page.locator()` calls (except in BaseAction)

### Pages (`src/pages/**/*.page.ts`)
- **ALLOWED:** Locator definitions, component composition, getter properties
- **FORBIDDEN:** Waits, business logic, assertions, API calls

### Components (`src/components/**/*.component.ts`)
- **ALLOWED:** Locators scoped to a root element, simple helpers (click, fill, getText)
- **FORBIDDEN:** Navigation, business logic, assertions, API calls

## Creating a New Feature

### 1. Identify the UI components
Inspect the React app and identify reusable UI elements (forms, grids, modals, navbars).

### 2. Create components
```
src/components/<module>/<ComponentName>.component.ts
```
- Extend `BaseComponent`
- Define locators scoped to a root element using `data-testid` or roles

### 3. Create page objects
```
src/pages/<module>/<PageName>.page.ts
```
- Extend `BasePage`
- Compose components
- Expose getter properties for locators

### 4. Create actions
```
src/actions/<module>/<FlowName>.actions.ts
```
- Extend `BaseAction`
- Call `setPage()` in constructor
- Write methods that orchestrate page objects (5-15 lines each)
- Wrap API-triggering actions in `runWithNetwork()`

### 5. Create assertions
```
src/assertions/<module>/<FlowName>.assertions.ts
```
- Plain class, no base class needed
- Methods like `verifyX()`, `assertY()`
- Use `expect()` from Playwright

### 6. Create fixture
```
src/fixtures/<featureName>.fixture.ts
```
- Wire pages → actions → assertions
- Block 3rd-party scripts
- Export `test` (NOT from `@playwright/test`)

### 7. Write tests
```
tests/<module>/<feature-name>.spec.ts
```
- Import `test` from your fixture
- Write scenarios using actions and assertions only
- Tag tests: `@smoke`, `@regression`, `@ci-pass`

## Selector Strategy for React

Preferred selector strategies for modern web applications:

| Priority | Strategy | Example | When to Use |
|----------|----------|---------|-------------|
| 1 | `data-testid` | `[data-testid="submit-btn"]` | Always add to key interactive elements |
| 2 | Role | `getByRole('button', { name: 'Submit' })` | Accessible elements with clear roles |
| 3 | Label | `getByLabel('Email Address')` | Form inputs with labels |
| 4 | Placeholder | `getByPlaceholder('Search...')` | Inputs with placeholder text |
| 5 | Text | `getByText('Welcome back')` | Static text content |
| 6 | CSS (semantic) | `input[type="email"]` | When role/label not available |

**NEVER use:**
- Auto-generated CSS class names (CSS modules, styled-components, Emotion)
- XPath — use CSS or role-based locators instead
- Positional selectors (`.nth()`, `:nth-child`) — fragile if order changes

## Network Synchronization

When an action triggers an API call, wrap it in `runWithNetwork()`:

```typescript
async createAccount(name: string): Promise<void> {
  await this.accountPage.nameInput.fill(name);

  // Only wrap the FINAL triggering click, not the entire form fill
  await this.runWithNetwork(
    () => this.accountPage.saveButton.click(),
    /\/api\/accounts/,       // RegExp matching the API URL
    'POST',                   // HTTP method
    201                       // Expected status code
  );
}
```

**Key rule:** Only wrap the **final triggering click** inside `runWithNetwork()`, not multi-step UI sequences.

## File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Component | `<Name>.component.ts` | `LoginForm.component.ts` |
| Page | `<Name>.page.ts` | `DashboardPage.page.ts` |
| Action | `<Name>.actions.ts` | `Login.actions.ts` |
| Assertion | `<Name>.assertions.ts` | `Login.assertions.ts` |
| Fixture | `<name>.fixture.ts` | `login.fixture.ts` |
| Spec | `<name>.spec.ts` | `login.spec.ts` |
