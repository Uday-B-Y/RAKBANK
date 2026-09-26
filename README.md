# Tinubu-E2E — End-to-End Testing Framework

Playwright E2E testing framework for the Tinubu platform, built on the **CAF (Component-Action-Fixture)** architecture pattern.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Install Playwright browsers
npx playwright install chromium

# 3. Configure environment (see "Environment & Credentials" section below)
cp .env.example .env

# 4. Fill in SETUP-QUESTIONNAIRE.md and apply answers to config files

# 5. Update tests/setup/global-setup.ts with your login flow

# 6. Run tests
npm test
```

---

## Environment & Credentials

### Step 1 — Create your `.env` file

Copy the example and fill in your values:

```bash
cp .env.example .env
```

Open `.env` and configure:

```env
# ── REQUIRED ──────────────────────────────────────────────

# The URL of the environment you want to test against
BASE_URL='https://your-app-url.com'

# Primary test user — used by most test specs
TEST_USER_EMAIL=your-test-user@example.com
TEST_USER_PASSWORD=your-test-password

# Admin user — used for setup/seeding operations (creating users, configuring settings)
ADMIN_EMAIL=your-admin@example.com
ADMIN_PASSWORD=your-admin-password

# ── OPTIONAL ──────────────────────────────────────────────

# Add more role-specific credentials as needed:
# READONLY_USER_EMAIL=
# READONLY_USER_PASSWORD=
# MANAGER_EMAIL=
# MANAGER_PASSWORD=

# Timeout overrides (milliseconds) — defaults are CI-aware
# PLAYWRIGHT_TIMEOUT=1200000
# ACTION_TIMEOUT=60000
# EXPECT_TIMEOUT=30000
# NAVIGATION_TIMEOUT=90000

# Worker count override
# Workers=4
```

> **IMPORTANT:** The `.env` file is git-ignored. Never commit credentials to the repository.

### Step 2 — Configure the login flow

Open **`tests/setup/global-setup.ts`** and update it to match your application's login page.
This file runs once before all tests, authenticates the test user, and saves the session to `storageState.json` so every test starts already logged in.

```typescript
// tests/setup/global-setup.ts
setup('authenticate', async ({ page }) => {
  await page.goto('/login');  // ← your login page route

  // Fill in credentials from .env
  await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL || '');
  await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD || '');
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Wait for the post-login page to confirm auth succeeded
  await page.waitForURL('**/dashboard', { timeout: 30000 });

  // Save session — all test specs reuse this authenticated state
  await page.context().storageState({ path: 'storageState.json' });
});
```

**What to change:**
| Item | Where to look in your app |
|------|--------------------------|
| Login page route | `/login`, `/auth`, `/signin`, or `/` — wherever the login form lives |
| Email/username field | Inspect the input — use `getByLabel()`, `getByPlaceholder()`, or `locator('[data-testid="..."]')` |
| Password field | Same — match the label or placeholder text |
| Submit button | Match by role + name: `getByRole('button', { name: 'Sign In' })` |
| Post-login URL | The URL the app redirects to after login (e.g. `/dashboard`, `/home`) |
| MFA / consent steps | Add additional steps between submit and `waitForURL` if needed |

### Step 3 — Verify it works

```bash
# Run just the setup to confirm login succeeds
npx playwright test tests/setup/global-setup.ts --headed
```

If it passes, you should see `storageState.json` created in the project root. All subsequent tests will reuse this session.

### How credentials flow through the framework

```
.env  →  dotenv loads into process.env  →  global-setup.ts reads them for login
                                         →  src/utils/constants.ts exposes via getCommonTestData()
                                         →  playwright.config.ts reads BASE_URL
```

| File | What it reads from `.env` |
|------|--------------------------|
| `playwright.config.ts` | `BASE_URL` — sets the base URL for all `page.goto('/')` calls |
| `tests/setup/global-setup.ts` | `TEST_USER_EMAIL`, `TEST_USER_PASSWORD` — login credentials |
| `src/utils/constants.ts` | `TEST_USER_EMAIL`, `ADMIN_EMAIL` — available to actions/fixtures via `getCommonTestData()` |

---

## Project Structure

```
Tinubu-E2E/
├── src/
│   ├── core/                      # Framework infrastructure (DO NOT MODIFY without full suite run)
│   │   ├── base/                  # BasePage, BaseAction, BaseComponent
│   │   ├── locators/              # FallbackLocator (intelligent selector with telemetry)
│   │   ├── sync/                  # NetworkWatcher, CIKeepAlive, ThirdPartyBlocker
│   │   └── telemetry/             # Selector health tracking
│   ├── components/<module>/       # Reusable UI components (locators)
│   ├── pages/<module>/            # Page objects (compose components)
│   ├── actions/<module>/          # Business flow actions
│   ├── assertions/<module>/       # Domain-specific assertions
│   ├── fixtures/                  # Test fixtures (wire pages → actions → assertions)
│   └── utils/                     # Constants, setup data, helpers
├── tests/
│   ├── setup/                     # Global setup (auth, data seeding)
│   └── <module>/                  # Test specs by module
├── scripts/                       # Governance (linter, selector checks, scaffolding)
├── docs/                          # Architecture documentation
├── SETUP-QUESTIONNAIRE.md         # Fill this in first!
├── playwright.config.ts
├── tsconfig.json
└── CLAUDE.md                      # AI-assisted development guide
```

## Architecture: CAF Pattern

```
Tests → Fixtures → Actions → Pages → Components → Core
```

Dependencies flow **downward only**. Each layer has strict boundaries:

| Layer | Responsibility | Forbidden |
|-------|---------------|-----------|
| **Tests** | Scenarios, assertions | Raw locators, `page.click()` |
| **Fixtures** | Wire pages/actions/assertions | Test logic |
| **Actions** | Business flows (5-15 lines/method) | Exposing locators |
| **Pages** | Compose components, locator getters | Logic, assertions |
| **Components** | Scoped locators, simple helpers | Navigation, logic |

See [docs/CAF-ARCHITECTURE.md](docs/CAF-ARCHITECTURE.md) for the full guide.

## Creating a New Module

Use the scaffolding generator:

```bash
npm run new-flow -- <module> <FlowName>
```

This creates all 6 CAF files (component, page, action, assertion, fixture, spec) with proper wiring.

## Governance

```bash
npm run lint:caf              # Check for CAF layer violations
npm run check:selectors       # Flag unstable selectors
npm run check:duplicates      # Find duplicate files
npm run check:governance      # Verify new files follow conventions
npx tsc --noEmit              # TypeScript compilation check
```

## Key Commands

```bash
npm test                              # Run all tests
npm test tests/<module>/              # Run module tests
npm run test:headed                   # Run with visible browser
npm run test:debug                    # Debug with Playwright inspector
npm run test:trace                    # Run with trace recording
npm run test:report                   # Open last HTML report
```

## First-Time Setup Checklist

1. `npm install` and `npx playwright install chromium`
2. Copy `.env.example` → `.env` and fill in `BASE_URL`, `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
3. Update `tests/setup/global-setup.ts` with your app's login selectors (see [Environment & Credentials](#environment--credentials))
4. Verify login works: `npx playwright test tests/setup/global-setup.ts --headed`
5. Fill in [SETUP-QUESTIONNAIRE.md](SETUP-QUESTIONNAIRE.md) and apply answers to configure modals, third-party blockers, CI detection, and selector strategy
6. Generate your first test flow: `npm run new-flow -- <module> <FlowName>`
7. Run `npx tsc --noEmit` to verify everything compiles
