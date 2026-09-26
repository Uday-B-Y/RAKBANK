# CLAUDE.md — Tinubu E2E Framework

This file provides guidance to Claude Code when working with code in this repository.

## Project

**Tinubu** — E2E testing framework built on Playwright using the CAF (Component-Action-Fixture) architecture pattern.

## Commands

```bash
# Run tests
npm test                                    # All tests
npm test tests/<module>/<spec>.spec.ts      # Single test file
npm test tests/<module>/                    # Tests in folder
npm run test:headed                         # Visible browser
npm run test:debug                          # Debug with inspector
npm run test:ui                             # Interactive UI mode
npm run test:report                         # View last HTML report

# Type checking
npx tsc --noEmit                            # TypeScript compilation check

# Governance
npm run lint:caf                            # CAF layer violation check
npm run check:selectors                     # Unstable selector detection
npm run check:duplicates                    # Duplicate file detection
npm run check:governance                    # New file governance check

# Scaffolding
npm run new-flow -- <module> <FlowName>     # Generate new CAF flow
```

## Architecture: CAF Pattern

**CAF = Component-Action-Fixture** — strict separation of concerns.

```
Tests (specs) → Fixtures (setup/auth) → Actions (business flows) → Pages (UI composition) → Components (locators)
```

### Layer Rules

| Layer | Location | Allowed | Forbidden |
|-------|----------|---------|-----------|
| **Tests** | `tests/**/*.spec.ts` | Call actions, assertions, `expect()` | Locators, `page.click`, waits, API calls |
| **Fixtures** | `src/fixtures/` | Setup/teardown, inject pages+actions | Test logic |
| **Actions** | `src/actions/` | Business flows (5-15 lines/method), `runWithNetwork()` | Exposing locators |
| **Pages** | `src/pages/` | Compose components, expose UI methods | Waits, logic, assertions |
| **Components** | `src/components/` | Pure locators and simple helpers | Logic, assertions, API calls |

### Core Infrastructure

| File | Purpose |
|------|---------|
| `src/core/base/BasePage.ts` | Abstract page base — modal auto-dismissal, CI keep-alive |
| `src/core/base/BaseAction.ts` | Abstract action base — `runWithNetwork()` for API sync |
| `src/core/base/BaseComponent.ts` | Abstract component base — root locator binding |
| `src/core/sync/NetworkWatcher.ts` | API response synchronization via `Promise.all` |
| `src/core/sync/CIKeepAlive.ts` | Prevents CI idle-session timeouts |
| `src/core/sync/ThirdPartyBlocker.ts` | Blocks analytics/chat 3rd-party scripts |
| `src/core/locators/FallbackLocator.ts` | Intelligent locator with telemetry-driven reordering |
| `src/core/telemetry/locator-telemetry.ts` | In-memory selector health tracking |

### Network Synchronization

Use `runWithNetwork()` in actions when triggering API calls. URL parameter is RegExp:

```typescript
async saveForm() {
  await this.runWithNetwork(
    () => this.page.saveButton.click(),
    /\/api\/endpoint\/pattern/,
    'POST',
    200,
    30000
  );
}
```

### Fixture Wiring Pattern

```typescript
export const test = base.extend<MyFixtures>({
  myFlow: async ({ page }, use) => {
    await ThirdPartyBlocker.block(page);
    const myPage = new MyPage(page);
    const actions = new MyActions(myPage);
    const assertions = new MyAssertions(myPage);
    await use({ actions, assertions });
  },
});
```

Tests import `test` from the fixture, not from `@playwright/test`.

## Environment

**Required `.env` file** (see `.env.example`):
```
BASE_URL='http://localhost:3000'
TEST_USER_EMAIL=<test_user>
TEST_USER_PASSWORD=<test_password>
ADMIN_EMAIL=<admin_user>
ADMIN_PASSWORD=<admin_password>
```

## Key Conventions

- **Always use `@/` path aliases** for imports from `src/`
- **No locators in actions or tests** — all UI interaction through pages/components
- **No `waitForTimeout()` (hard waits)** — use `NetworkWatcher` for API sync
- **One fixture per feature** — fixtures own lifecycle
- **Role-based locators** (`getByRole`) are preferred over CSS selectors where accessible

## Guardrails

| Rule | Reason |
|------|--------|
| **NEVER touch base classes without full suite run** | Shared by ALL specs |
| **Max 3 files per commit** | Limits blast radius |
| **`npx tsc --noEmit` before every commit** | Catch type errors early |
| **Trace-first for ALL fixes** | Blind fixes cause regressions |
| **No `waitForTimeout()`** | Use proper waits instead |
