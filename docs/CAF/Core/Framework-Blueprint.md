# CAF Framework Blueprint
**Generated:** 2026-03-11 | **Purpose:** Structured reference for AI coding agents and developers

> **Note:** This document was originally written for the first production implementation
> of the CAF pattern. Module names, file counts, and directory structures reflect that
> reference codebase. Use it as a **reference example** of how CAF scales to an
> enterprise application, not as project-specific documentation.

---

## 1. Framework Overview

This is an enterprise **Playwright E2E testing framework** built on the **CAF (Component-Action-Fixture)** pattern — a strict separation-of-concerns architecture that enforces:

```
Tests (specs) → call only fixtures
  Fixtures    → compose pages + actions + assertions
    Actions   → orchestrate page methods (business flows)
      Pages   → compose components (UI structure)
        Components → hold locators (atomic UI elements)
```

**Application under test:** *(Reference implementation — a web-based enterprise platform. Replace with your application details.)*

**Key stats:**
- 441 source files across 6 CAF layers
- 31 test spec files organized by feature module
- 215 components, 90 pages, 56 actions, 38 assertions, 20 fixtures
- 11 feature modules: Admin, QC, Delivery, Field, LIMS, ProjectAdmin, Scheduling, Home, Billing, Auth, TrainingCenter

---

## 2. Directory Structure

```
project-root/
├── playwright.config.ts          # Main Playwright configuration
├── tsconfig.json                 # TypeScript + path aliases (@/ → src/)
├── package.json                  # Scripts, dependencies
├── .env                          # Credentials & BASE_URL
├── CLAUDE.md                     # AI agent instructions
├── storageState.json             # OUTPUT: Saved auth session
├── setup-data.json               # OUTPUT: Generated test data seed
│
├── src/
│   ├── core/
│   │   ├── base/
│   │   │   ├── BasePage.ts       # All pages inherit (goto, waitForReady, common locators)
│   │   │   ├── BaseAction.ts     # All actions inherit (setPage, runWithNetwork)
│   │   │   └── BaseComponent.ts  # All components inherit (root, waitForVisible)
│   │   ├── sync/
│   │   │   ├── NetworkWatcher.ts # API sync: actionWithApiWait()
│   │   │   └── CIKeepAlive.ts    # CI pipeline session keep-alive
│   │   ├── locators/
│   │   │   └── FallbackLocator.ts
│   │   └── telemetry/
│   │       └── locator-telemetry.ts, selector-usage.ts
│   │
│   ├── components/               # 215 files — Atomic UI elements
│   │   ├── common/               # Shared: Button, Input, Dropdown, Modal, Table
│   │   ├── admin/                # 56 files (forms, grids, modals)
│   │   ├── delivery/             # 49 files (reports, email, batch)
│   │   ├── dashboard/            # 13 files (tiles, charts, filters)
│   │   ├── home/                 # 9 files (tiles: Weather, Notepad, Schedule)
│   │   ├── qc/                   # 6 files (activity links, date cells)
│   │   ├── lims/                 # 15 files (queues, modals, selectors)
│   │   ├── projectadmin/         # 21 files (specs, documents)
│   │   ├── utilities/            # 22 files (extract grids, filters)
│   │   ├── profile/              # 4 files
│   │   ├── superadmin/           # 3 files (company forms, user creation)
│   │   └── trainingcenter/       # 3 files
│   │
│   ├── pages/                    # 90 files — UI composition (zero logic)
│   │   ├── auth/                 # Login.page.ts
│   │   ├── home/                 # HomeDashboard.page.ts, Dashboard.page.ts
│   │   ├── admin/                # 16 files (FormDesigner, ReportDesigner, etc.)
│   │   ├── qc/                   # 12 files (AddEditActivity, EditSample, etc.)
│   │   ├── lims/                 # 15 files (AssignTests, EnterResults, etc.)
│   │   ├── field/                # 14 files (FieldMenu, DensityTesting, etc.)
│   │   ├── delivery/             # 3 files
│   │   ├── billing/              # 6 files
│   │   ├── projectadmin/         # 6 files
│   │   ├── scheduling/           # 3 files
│   │   ├── superadmin/           # 2 files
│   │   └── trainingcenter/       # 1 file
│   │
│   ├── actions/                  # 56 files — Business flows (5-15 lines/method)
│   │   ├── setup/                # 5 files (GlobalSetup, ProjectSetup, SuperAdmin, etc.)
│   │   ├── admin/                # 13 files
│   │   ├── qc/                   # 11 files
│   │   ├── lims/                 # 8 files
│   │   ├── field/                # 6 files
│   │   ├── delivery/             # 4 files
│   │   ├── scheduling/           # 2 files
│   │   ├── home/                 # 1 file
│   │   └── [other modules]
│   │
│   ├── assertions/               # 41 files — Test outcome verification
│   │   └── [mirrors actions/ structure by module]
│   │
│   ├── fixtures/                 # 32 files — Test lifecycle (setup/auth/DI)
│   │   ├── headed.fixture.ts     # Forces headless: false for PDF tests
│   │   └── [feature].fixture.ts  # One per feature flow
│   │
│   ├── utils/
│   │   ├── constants.ts          # 164 API endpoint regex patterns
│   │   ├── routes.ts             # URL builders: buildUrl(), AdminRoutes, etc.
│   │   ├── helpers.ts            # formatDate, waitForGridCover, delay, etc.
│   │   ├── setup-data.ts         # SetupDataStorage: generate/load/save test data
│   │   ├── config.ts, env.ts     # Environment helpers
│   │   └── logger.ts
│   │
│   └── reporting/
│       ├── flake.detector.ts
│       ├── heatmap.collector.ts
│       └── metrics.collector.ts
│
├── tests/
│   ├── global-setup.ts           # Runs ONCE before all tests
│   ├── global-teardown.ts        # Post-suite cleanup (currently empty)
│   ├── seed.spec.ts              # Seed data spec
│   ├── admin/                    # 5 specs
│   ├── qc/                       # 6 specs
│   ├── lims/                     # 6 specs
│   ├── field/                    # 5 specs
│   ├── delivery/                 # 2 specs
│   ├── billing/                  # 1 spec
│   ├── dashboard/                # 1 spec
│   ├── projectadmin/             # 1 spec
│   ├── scheduling/               # 1 spec
│   ├── trainingcenter/           # 1 spec
│   └── utilities/                # 1 spec
│
├── objects/                      # 44 files — Test data (JSON, PDF, images)
│   ├── sampling/                 # LIMS form JSON templates
│   ├── forms/                    # Activity/admin/charting form JSONs
│   ├── delivery/                 # PDF uploads for delivery tests
│   ├── DiscreteUploads/          # PDFs, JPGs, PNGs for upload tests
│   └── images/                   # PNG, HEIF, WebP for image upload tests
│
├── scripts/                      # 54 tooling scripts
│   ├── caf-linter.ts             # CAF pattern compliance checker
│   ├── ci-gate.ts                # Master CI validation gate
│   ├── generate-registry.ts      # Registry documentation generator
│   ├── detect-unstable-selectors.ts
│   └── [30+ other scripts]
│
├── legacy-reference/             # Full legacy framework (for migration reference ONLY)
│
└── GuidlinesAndGoverancesDocs/   # 52 governance/migration documents
```

**Naming conventions:**
| Layer | File Pattern | Class Pattern |
|-------|-------------|---------------|
| Components | `PascalCase.component.ts` | `PascalCase` |
| Pages | `PascalCase.page.ts` | `PascalCasePage` |
| Actions | `PascalCase.actions.ts` | `PascalCaseActions` |
| Assertions | `PascalCase.assertions.ts` | `PascalCaseAssertions` |
| Fixtures | `camelCase.fixture.ts` | N/A (exports `test`) |
| Specs | `kebab-case.spec.ts` | N/A |

**Path aliases (tsconfig.json):**
```typescript
@/*            → src/*
@/core/*       → src/core/*
@/components/* → src/components/*
@/pages/*      → src/pages/*
@/actions/*    → src/actions/*
@/fixtures/*   → src/fixtures/*
@/utils/*      → src/utils/*
@/services/*   → src/services/*
```

---

## 3. Global Setup Flow

### Execution Sequence
```
npx playwright test
  │
  ▼
tests/global-setup.ts (runs ONCE before any worker)
  │
  ├── Phase 1: VALIDATE
  │   ├── Check BASE_URL exists
  │   ├── Derive SuperAdmin URL from BASE_URL pattern
  │   └── Launch headless Chromium
  │
  ├── Phase 2: DETECT MODE
  │   ├── If DOSETUP env set → use that
  │   └── Else → probe login with TESTER credentials
  │       ├── Login succeeds → DOSETUP=0 (skip user creation)
  │       └── Login fails → DOSETUP=1 (full setup)
  │
  ├── Phase 3: SUPERADMIN (only if DOSETUP=1)
  │   ├── Login to SuperAdmin portal
  │   ├── Configure company settings (feature toggles)
  │   └── Create test user (idempotent — skips if exists)
  │
  ├── Phase 4: AUTHENTICATE
  │   ├── Login as TESTER or DEV user
  │   ├── Save browser session → storageState.json
  │   └── Set TESTER/pass env vars for downstream tests
  │
  ├── Phase 5: SEED DATA (idempotent)
  │   ├── ProjectSetup: Create Client, Office, Project
  │   ├── EnvironmentSetup: Labs, Technician, Digital Signatures, Labels
  │   └── TestSetup: Import JSON forms, create TestAutoReport
  │
  └── Phase 6: WARM-UP
      └── Pre-load Project Admin page (prevents first-load failure)
```

### Setup Data Lifecycle
```
setup-data.json
  │
  ├── Generated by: SetupDataStorage.generateSetupData()
  │   └── Random 4-digit NUM → all entity names suffixed: "TestClient7823"
  │
  ├── Saved to: ./setup-data.json
  │
  ├── Applied to: process.env (key=value for each field)
  │   └── Tests access via: process.env.testProject, process.env.testLab, etc.
  │
  └── Reused on: DOSETUP=0 or REUSE_SETUP=1
      └── Loads from file, applies to env, skips regeneration
```

### Setup Action Files
| File | Responsibility |
|------|---------------|
| `GlobalSetup.actions.ts` | Orchestrator: detects mode, calls sub-actions |
| `ProjectSetup.actions.ts` | Creates Client, Office, Project (UI-driven) |
| `EnvironmentSetup.actions.ts` | Creates Labs, Technician, Signatures, Labels |
| `TestSetup.actions.ts` | Imports JSON forms, creates reports in Form Designer |
| `SuperAdminSetup.actions.ts` | SuperAdmin login, company config, user creation |
| `setup-data.ts` | Generates/loads/saves `setup-data.json` |

---

## 4. Authentication Model

### Strategy: Shared Storage State
```
global-setup.ts
  │ login as TESTER_NAME / TESTER_PASS
  │ page.context().storageState({ path: 'storageState.json' })
  ▼
storageState.json (cookies + localStorage)
  │
  ▼
playwright.config.ts
  use: {
    storageState: 'storageState.json'   ← All tests start pre-authenticated
  }
  │
  ▼
Test workers (4 parallel)
  └── Each worker loads storageState.json → no login needed
```

### User Hierarchy
| User | Credentials Env Var | Usage |
|------|-------------------|-------|
| SuperAdmin | SA_NAME / SA_PASS | Company config, user creation |
| Tester | TESTER_NAME / TESTER_PASS | Primary test user (created during setup) |
| Dev | DEV_NAME / DEV_PASS | Fallback user (pre-existing) |

### Login Page (AuthPage)
```typescript
// Locator resilience pattern — triple fallback:
readonly usernameInput = this.page.getByLabel(/username/i)
  .or(this.page.getByTestId('UserName'))
  .or(this.page.locator('#UserName'));

// Login is idempotent — checks if already logged in:
async login(username, password) {
  if (await this.isLoggedIn()) return;  // Skip if session active
  await this.usernameInput.fill(username);
  await this.passwordInput.fill(password);
  await this.submitButton.click();
}
```

---

## 5. Test Data Lifecycle

### Data Generation
```typescript
// SetupDataStorage generates ALL entity names from a single random NUM:
const num = '7823';  // Random 4-digit
{
  testClient:    'Test Client7823',
  testProject:   '7823Test',
  testOffice:    'Test Office7823',
  testLab:       'testlab7823',
  testLab2:      '2testlab7823',
  testPM:        'MGD, magadha',
  customMaterial: 'E2EMaterial7823',
  reportLabel:   'E2ELabel7823',
  // ... 26 total fields
}
```

### Data Flow
```
1. global-setup.ts calls SetupDataStorage.generateSetupData()
2. Data saved to setup-data.json
3. All fields applied to process.env
4. ProjectSetup/EnvironmentSetup/TestSetup create entities in the app via UI
5. Tests access data via process.env:
     const { testProject, testLab, testPM } = process.env;
```

### Idempotency Pattern (all setup actions)
```typescript
// EVERY create method checks UI grid first:
async createClientIfNotExists(page, baseURL, testClient) {
  await page.goto(clientSearchUrl);
  const apiResponse = await page.waitForResponse(r => r.url().includes('/GetRecentClients'));

  // Check if exists in grid
  const clientRow = page.locator('td').getByText(testClient, { exact: true });
  try {
    await clientRow.waitFor({ state: 'visible', timeout: 5000 });
    console.log(`Client "${testClient}" already exists — skipping`);
    return;  // ← Idempotent exit
  } catch {
    // Not found — proceed to create
  }
  // ... create client via UI
}
```

---

## 6. Page Object Design Pattern

### Class Hierarchy
```
BasePage (src/core/base/BasePage.ts)
│
├── Properties:
│   ├── page: Page (protected, from Playwright)
│   ├── getPage: Page (getter, used by Actions)
│   ├── Common locators (filters, buttons shared across LIMS pages)
│   └── Common components (sampleSelector, sideMenu)
│
├── Methods:
│   ├── waitForReady(): Waits for body visible
│   ├── goto(url): Navigate + waitForReady
│   └── Module-specific navigation methods
│
└── Child Pages extend and add:
    ├── Feature-specific locators
    ├── Component instances
    └── UI workflow methods (zero business logic)

BaseComponent (src/core/base/BaseComponent.ts)
│
├── Properties:
│   ├── root: Locator (scopes all child queries)
│   └── page: Page
│
├── Methods:
│   ├── waitForVisible(): root visible within 15s
│   ├── waitForHidden(): root hidden within 15s
│   └── waitForText(locator, text): text appears within 15s
│
└── Child Components extend and add:
    ├── Sub-element locators (scoped to this.root)
    └── Interaction methods (click, fill, select)
```

### Page Composition Pattern
```typescript
// Pages COMPOSE components:
export class HomeDashboardPage extends BasePage {
  // Component instances
  readonly qualityControlLink = new QualityControlLink(this.page);
  readonly tileLibrary = new TileLibrary(this.page);
  readonly favoritesTile = new FavoritesTile(this.page);
  readonly notepadTile = new NotepadTile(this.page);

  // Direct locators for simple elements
  readonly fieldLink = this.page.getByRole('button', { name: 'Field', exact: true });
  readonly administrationLink = this.page.getByRole('link', { name: 'Admin', exact: true });

  // Navigation methods
  async goto() { await this.page.goto('/'); await this.waitForReady(); }
  async navigateToQualityControl() { await this.qualityControlLink.click(); }
}
```

### Component Scope Isolation
```typescript
// Components scope child locators to their root:
export class ReceiveDialog extends BaseComponent {
  constructor(page: Page) {
    super(page, '[role="dialog"]');  // Root = dialog element
  }

  // All child locators scoped to dialog:
  readonly receiveButton = this.root.getByRole('button', { name: /receive/i });
  readonly confirmButton = this.root.getByRole('button', { name: /confirm|ok/i });

  async confirm() {
    await this.waitForVisible();
    await this.confirmButton.click();
  }
}
```

### Pages Can Compose Other Pages
```typescript
export class AdminHomePage extends BasePage {
  private readonly activitiesForms: ActivitiesFormsPage;  // ← Nested page

  constructor(page: Page) {
    super(page);
    this.activitiesForms = new ActivitiesFormsPage(page);
  }

  async openSampleForms() {
    return this.activitiesForms.openSampleForms();  // Delegates
  }
}
```

---

## 7. Test Execution Pattern

### Fixture Architecture (the "F" in CAF)
```typescript
// Every fixture follows this template:

// 1. Import base test
import { test as base } from '@playwright/test';

// 2. Define fixture type
type MyFixtures = {
  myFeature: {
    doSomething(arg: string): Promise<void>;
    runFullFlow(): Promise<void>;
    assertions: MyAssertions;
  };
};

// 3. Extend base and wire CAF layers
export const test = base.extend<MyFixtures>({
  myFeature: async ({ page }, use) => {
    // Instantiate Pages (UI composition)
    const pageA = new PageA(page);
    const pageB = new PageB(page);

    // Instantiate Actions (inject pages)
    const actions = new MyActions(pageA, pageB);

    // Instantiate Assertions (inject pages/components)
    const assertions = new MyAssertions(pageA);

    // Optional: Initial navigation
    await page.goto('/');

    // Provide to test
    await use({
      doSomething: (arg) => actions.doSomething(arg),
      runFullFlow: () => actions.runFullFlow(),
      assertions,
    });
  }
});
```

### Spec File Pattern
```typescript
// Thin spec — all logic in fixture/actions:
import { test } from '@/fixtures/qcCreateActivity.fixture';

test('@core Create Activity in Quality Control', async ({ qcCreateActivity }) => {
  await qcCreateActivity.runFullFlow();
  await qcCreateActivity.assertions.activityRowVisible('Test Activity Form');
});
```

### Multi-Fixture Spec Pattern
```typescript
// When one spec uses multiple fixtures:
import { test as workOrderTest } from '@/fixtures/workOrderFlow.fixture';
import { test as schedulingTest } from '@/fixtures/schedulingTests.fixture';

workOrderTest.beforeEach(async ({ page }) => {
  const home = new HomeDashboardPage(page);
  await home.goto();
});

schedulingTest.beforeEach(async ({ page }) => {
  const home = new HomeDashboardPage(page);
  await home.goto();
});

workOrderTest('@e2e Create Work Orders', async ({ workOrderFlow }) => {
  const woNum = await workOrderFlow.createWorkOrder(...);
  await workOrderFlow.assertions.workOrderIsCancelled(woNum);
});

schedulingTest('@core Create Activity Work Order', async ({ schedulingTests }) => {
  schedulingTest.skip(process.env.DOSETUP === '0');  // Conditional skip
  await schedulingTests.createActivityWorkOrder(...);
  await schedulingTests.verifyActivityWorkOrderCreated(...);
});
```

### Fixture Composition Patterns

**Pattern A: Single orchestrated flow**
```typescript
// qcCreateActivity — one method does everything
runFullFlow(): Promise<void>;
assertions: QCCreateActivityAssertions;
```

**Pattern B: Granular methods**
```typescript
// dashboardTiles — many methods for fine-grained control
enableUniversalTiles(): Promise<void>;
setupNotepadTile(note: string): Promise<void>;
createWorkOrderForToday(...): Promise<string>;
cleanupFavorites(name: string): Promise<void>;
assertions: DashboardTilesAssertions;
```

**Pattern C: Nested actions (action receives action)**
```typescript
// fullDIYSampleFlow — actions compose sub-actions
const assignTestsActions = new AssignTestsActions(assignTests);
const actions = new FullDIYSampleFlowActions(..., assignTestsActions, ...);
```

**Pattern D: Actions receive assertions**
```typescript
// formsDesigner — actions validate mid-flow
const assertions = new FormsDesignerAssertions(page, formDesigner);
const actions = new FormsDesignerActions(adminHome, limsForms, formDesigner, homeDashboard, assertions);
```

### Test Tags
| Tag | Purpose | Run with |
|-----|---------|----------|
| `@core` | Core functionality (must always pass) | `--grep "@core"` |
| `@e2e` | Full end-to-end flows | `--grep "@e2e"` |
| `@onetime` | Setup-only tests (run once) | `--grep "@onetime"` |
| `@slow` | Long-running tests | `--grep "@slow"` |
| `@CAF` | CAF pattern compliance marker | `--grep "@CAF"` |
| `@MFM` | Requires headed browser (PDF/signing) | Runs in headed-chromium project |

---

## 8. Environment Handling

### Environment Variables
| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `BASE_URL` | Yes | - | Application URL (e.g. `https://your-app.com`) |
| `TEST_USER_EMAIL` | Yes | - | Test user email/username |
| `TEST_USER_PASSWORD` | Yes | - | Test user password |
| `ADMIN_EMAIL` | No | - | Admin user email/username |
| `ADMIN_PASSWORD` | No | - | Admin user password |
| `DOSETUP` | No | auto | `1`=fresh, `0`=warm, unset=auto-detect |
| `REUSE_SETUP` | No | `0` | `1`=reuse setup-data.json |
| `HEADED` | No | `false` | `true`=show browser |
| `NUM` | No | random | Override unique ID seed |
| `CI` | No | - | Set by CI pipeline |
| `AZURE` | No | - | Set by Azure Pipelines |

### Timeout Scaling (playwright.config.ts)
| Setting | Local | CI |
|---------|-------|----------|
| Test timeout | 10 min | 20 min |
| Action timeout | 30 sec | 60 sec |
| Navigation timeout | 60 sec | 300 sec |
| Expect timeout | 15 sec | 30 sec |
| Workers | 4 | 4 |
| Retries | 0 | 1 |
| Traces | on (always) | retain-on-failure |

### CI/Azure Browser Args
```
--disable-dev-shm-usage
--disable-gpu
--no-sandbox
--disable-web-security
--disable-blink-features=AutomationControlled
```

### Config Projects
1. **chromium** (default): Headless, uses storageState, runs all tests
2. **headed-chromium**: `headless: false`, only for `@MFM` tagged tests (PDF preview, signing)

### URL Construction
```typescript
import { buildUrl, AdminRoutes, ProjectAdminRoutes } from '@/utils/routes';

// Centralized route constants:
AdminRoutes.GENERAL.OFFICES          // → 'Admin/General/Offices'
AdminRoutes.LIMS_SAMPLES.LABS        // → 'Admin/LIMSSamples/Labs'
AdminRoutes.SECURITY.USERS           // → 'Admin/Security/Users'
ProjectAdminRoutes.PROJECT_SETUP.CLIENT_SEARCH  // → 'ProjectAdministration/ProjectSetup/Clients'

// Usage:
await page.goto(buildUrl(baseURL, AdminRoutes.GENERAL.OFFICES));
```

---

## 9. Selector Strategy

### Observed Usage (current codebase)
```
1. getByRole()      — 555 uses across 153 files (most common)
2. CSS/ID locators  — 633 uses across 110 files (legacy + data attributes)
3. getByLabel()     — Used for form inputs
4. getByTestId()    — 23 uses across 12 files (growing)
5. XPath            — Table row selection only
```

> **Governance target**: New code should follow the priority defined in `CAF_AI_LINT_RULES.md`:
> `getByTestId > CSS > getByRole > getByLabel/getByText > XPath (last resort)`.
> The observed usage above reflects the historical codebase; the governance target prioritizes `data-testid` for deterministic, framework-controlled selectors.

### Selector Patterns

**Pattern 1: Accessibility-First (getByRole)**
```typescript
readonly filterSearchButton = this.page.getByRole('button', { name: 'Search', exact: true });
readonly projectNumberInput = this.page.getByRole('textbox', { name: 'Project Number' });
readonly labDropdown = this.page.getByRole('combobox', { name: 'Lab' });
```

**Pattern 2: Triple Fallback with .or()**
```typescript
// Most resilient — tries semantic, then test-id, then CSS:
readonly submitButton = this.page.getByRole('button', { name: /login|submit|sign in/i })
  .or(this.page.getByTestId('btnSubmit'))
  .or(this.page.locator('#btnSubmit'));
```

**Pattern 3: Data Attributes (for dynamic forms)**
```typescript
// Example: forms using data-system-name for field identification:
readonly technicianSelect = this.page.locator('select[data-system-name="LabTechnician"]');

// Dynamic accessor pattern:
getInputByFieldName(fieldName: string): Locator {
  return this.page.locator(`input[data-system-name="${fieldName}"]`);
}
```

**Pattern 4: Component Scoping**
```typescript
// Components scope child locators to their root:
class ReceiveDialog extends BaseComponent {
  constructor(page) { super(page, '[role="dialog"]'); }
  readonly confirmButton = this.root.getByRole('button', { name: /confirm/i });
  // ↑ this.root ensures locator is scoped to dialog only
}
```

**Pattern 5: XPath (table rows only)**
```typescript
// Dynamic table selection by content:
await this.page.locator(`//tr[contains(.,"${sampleNumber}")]//input[@type="checkbox"]`).first();
```

**Pattern 6: Visibility Modifier**
```typescript
// Disambiguate multiple matching elements:
readonly link = this.page.locator('a[href="/Admin/Activity/Forms"]:visible');
```

### Selector Scoring
- CI gate enforces **score >= 60** for all selectors
- Locator score check enforces **score >= 75** for migration output
- `scripts/detect-unstable-selectors.ts` scans entire `src/` directory

---

## 10. Action Layer Design

### BaseAction
```typescript
export abstract class BaseAction {
  protected page: Page | undefined;

  protected setPage(page: Page) { this.page = page; }

  protected async runWithNetwork(
    action: () => Promise<void>,
    url: RegExp,
    method: string = 'POST',
    status: number = 200,
    timeout: number = 30000
  ) {
    await NetworkWatcher.actionWithApiWait(action, { url, method, status, timeout }, this.page);
  }
}
```

### Action Constructor Pattern
```typescript
export class MyActions extends BaseAction {
  constructor(
    private readonly pageA: SomePage,
    private readonly pageB: AnotherPage
  ) {
    super();
    this.setPage(pageA.getPage);  // ALWAYS set page from first dependency
  }
}
```

### Network Synchronization (replacing hard waits)
```typescript
// Instead of: await page.waitForTimeout(2000);
// Use:
await this.runWithNetwork(
  () => this.pageA.saveButton.click(),      // Action that triggers API
  API_ENDPOINTS.FORMS_DESIGNER.SAVE_FORM,   // URL regex pattern
  'POST',                                    // HTTP method
  200                                        // Expected status
);

// For multi-step actions:
await this.runWithNetwork(
  async () => {
    await this.pageA.importButton.click();
    await this.pageA.fileInput.setInputFiles(filePath);
    await this.pageA.confirmButton.click();
  },
  /\/ImportForm/,
  'POST',
  200
);
```

### API Endpoint Constants
```typescript
// src/utils/constants.ts — 164 regex patterns organized by module:
export const API_ENDPOINTS = {
  SCHEDULING: {
    SAVE_WORK_ORDER_EVENT: /SaveWorkOrderEvent/,
    GET_PENDING_FIELD_ACTIONS: /GetPendingFieldActions/,
    // ... 11 patterns
  },
  FORMS_DESIGNER: {
    IMPORT_FORM: /ImportForm/,
    SAVE_FORM: /SaveForm/,
    NAVIGATE_TO_SAMPLE_FORMS: /GetSampleForms/,
    // ... 7 patterns
  },
  // ... QC, Delivery, ProjectAdmin, Admin, etc.
};
```

---

## 11. Assertions Layer Design

### Assertion Patterns

**Pattern 1: Page-based assertions**
```typescript
export class QCCreateActivityAssertions {
  constructor(
    private readonly page: Page,
    private readonly activitiesPage: ActivitiesReviewPage
  ) {}

  async activityRowVisible(formName: string) {
    await expect(this.page.getByText(formName)).toBeVisible();
  }
}
```

**Pattern 2: Component-based assertions**
```typescript
export class DashboardTilesAssertions {
  constructor(
    private readonly page: Page,
    private readonly favoritesTile: FavoritesTile  // Component!
  ) {}

  async favoritesContains(text: string) {
    await expect(this.favoritesTile.root).toContainText(text);
  }
}
```

**Pattern 3: test.step() wrapped assertions (for Allure reports)**
```typescript
export class AdminUsersAssertions {
  constructor(private readonly adminUsers: AdminUsersPage) {}

  async userModalHidden() {
    await test.step('Verify user modal is hidden', async () => {
      await expect(this.adminUsers.userModal).toBeHidden();
    });
  }
}
```

### Assertion Matchers Used
- `toBeVisible()` — Element presence
- `toBeHidden()` — Element absence
- `toContainText()` — Text content
- `toHaveCount()` — Collection size
- `toHaveValue()` — Input value

---

## 12. CI Execution Model

### Validation Pipeline
```
npm run ci:gate
  │
  ├── npm run lint:caf          # Scan *.spec.ts for CAF violations
  │   ├── No page.locator() in specs
  │   ├── No page.waitFor*() in specs
  │   └── No direct page access
  │
  ├── npm run check:selectors   # Score all selectors (threshold: 60+)
  │
  ├── npm run check:duplicates  # Detect duplicate files
  │
  └── npm run check:registry    # Check registry naming conflicts
```

### Test Execution
```
npx playwright test
  │
  ├── global-setup.ts (once)
  │   └── Auth + seed data
  │
  ├── Workers: 4 parallel
  │   ├── Worker 1: tests/qc/*.spec.ts
  │   ├── Worker 2: tests/admin/*.spec.ts
  │   ├── Worker 3: tests/lims/*.spec.ts
  │   └── Worker 4: tests/field/*.spec.ts
  │
  ├── Retries: 1 (CI only)
  │
  └── global-teardown.ts (once)
      └── (currently empty)
```

### Reports
| Reporter | Environment | Output |
|----------|------------|--------|
| Line | All | Console |
| HTML | All | `reports/html/` |
| JUnit XML | CI only | For pipeline integration |
| Allure | Local | If allure-playwright installed |
| JSON | Local | Raw results data |

### Traces
- **Local**: Always captured (`trace: 'on'`)
- **CI/Azure**: Retained on failure only (`trace: 'retain-on-failure'`)
- **Output**: `./traces/` directory
- **Screenshots**: Only on failure

---

## 13. Rules for AI Agents Generating Tests

### MUST follow:
1. **Never put locators in spec files** — use fixture methods only
2. **Never put waits in spec files** — waits belong in actions or pages
3. **Always use @/ path aliases** — never relative imports like `../../../`
4. **Check docs/registry.md before creating new pages/components** — extend existing ones
5. **Always extend BasePage for pages, BaseComponent for components, BaseAction for actions**
6. **Always call `super()` then `this.setPage()` in action constructors**
7. **Keep action methods to 5-15 lines** — decompose larger flows
8. **Use `runWithNetwork()` for any action that triggers an API call**
9. **Use the API_ENDPOINTS constants** for network synchronization URLs
10. **Create one fixture per feature flow** — wire pages + actions + assertions
11. **Tests should be <20 lines** — all complexity in actions
12. **Tag tests**: `@core` for critical, `@e2e` for integration, `@slow` for long-running

### MUST NOT do:
1. **No `page.locator()` in test specs** — use page objects
2. **No `page.waitForTimeout()` anywhere** — use NetworkWatcher or element waits
3. **No `networkidle`** — use specific API response waits
4. **No locators in action files** — actions call page methods only
5. **No business logic in page files** — pages are pure UI composition
6. **No assertions in action files** (exception: when assertions are injected as dependency)
7. **No manual page instantiation in tests** — use fixtures for dependency injection
8. **No hardcoded URLs** — use `buildUrl()` + route constants
9. **No hardcoded test data** — use `process.env` values from setup-data.json
10. **No raw `@playwright/test` import in new specs** — import `test` from a fixture

### Generating a new test flow:
```
Step 1: Check registry.md → find/extend existing pages
Step 2: Create Components (if needed) → atomic UI elements with root locator
Step 3: Create Page → compose components, zero logic
Step 4: Create Action → extend BaseAction, use runWithNetwork()
Step 5: Create Assertions → receive pages/components, use expect()
Step 6: Create Fixture → wire pages + actions + assertions
Step 7: Create Spec → import fixture, call methods, assert
Step 8: Run npm run generate-registry → update registry
Step 9: Run npm run lint:caf → verify compliance
```

---

## 14. Legacy Framework Reference

The `legacy-reference/` directory contains the sunset framework. Key differences:

| Aspect | Legacy | CAF (Current) |
|--------|--------|---------------|
| Architecture | Raw Page Object Model | CAF (Component-Action-Fixture) |
| Setup | Headed browser, hardcoded URLs | Headless, dynamic URL derivation |
| Data seeding | None (tests seed own data) | Full idempotent seeding in global setup |
| Auth | Per-test login | Shared storageState.json |
| Locators | In tests and pages | Only in components and pages |
| Waits | `networkidle`, `waitForTimeout` | NetworkWatcher API response waits |
| Selectors | Primarily CSS/ID | Accessibility-first (getByRole) |
| CI | Fragile (headed, no retries) | Azure-safe (headless, scaled timeouts) |

**Legacy is reference-only. All new work uses CAF pattern.**

---

*Blueprint generated for AI Agent consumption — Agile Frameworks E2E Automation*
