# Global Setup AI Agent Handoff Guide
**Document Purpose:** This guide provides a central index and strict instruction set for AI agents or developers working on the Global Setup migration and hardening.

---

## 1. File Index (Where to Look)

### 🚀 CAF Framework (Current Focus)
| File Path | Purpose |
|-----------|---------|
| `tests/global-setup.ts` | **Entry Point:** Orchestrates browser context and high-level sequence. |
| `src/actions/setup/GlobalSetup.actions.ts` | **Orchestrator:** Manages the Step 1/2/3 flow and `DOSETUP` logic. |
| `src/actions/setup/ProjectSetup.actions.ts` | **Seeder:** Clients, Offices, Projects. |
| `src/actions/setup/EnvironmentSetup.actions.ts` | **Seeder:** Labs, Technicians, Signatures, Labels. |
| `src/actions/setup/TestSetup.actions.ts` | **Seeder:** Form Imports, Report Designer Config. |
| `src/utils/setup-data.ts` | **Data Utility:** Randomized naming and `setup-data.json` storage. |

### 📜 Legacy Reference (Source of Truth for Coverage)
| File Path | Purpose |
|-----------|---------|
| `legacy-reference/tests/GlobalSetup.ts` | Legacy user creation and random number generation. |
| `legacy-reference/tests/setup/*.psetup.ts` | Legacy Project seeding logic. |
| `legacy-reference/tests/setup/*.esetup.ts` | Legacy Environment seeding logic. |
| `legacy-reference/tests/setup/*.tsetup.ts` | Legacy Test data seeding logic. |

---

## 2. How to Achieve (Implementation Patterns)

When adding new setup functionality, you **MUST** follow these CAF standards:

### A. The Idempotency Pattern (No Duplicates)
Every creation method must first check if the record exists.
```typescript
// GOOD: Check grid before clicking "Add"
await page.locator('.grid').waitFor({ state: 'visible' });
const exists = await page.getByText(recordName).isVisible();
if (exists) return; // Skip creation
```

### B. The API Lock Pattern (No Race Conditions)
Never wait for `networkidle`. Always wait for the specific save endpoint.
```typescript
// GOOD: Specific API wait
const savePromise = page.waitForResponse(r => r.url().includes('/SaveClient') && r.status() === 200);
await page.click('#btnSave');
await savePromise;
```

### C. The Autocomplete Pattern
Legacy used `Enter` which is flaky. Use the CAF "Click & Tab" pattern.
```typescript
// GOOD: Wait for dropdown and click or Tab
await input.fill(text);
const item = page.locator('.ui-menu-item:visible').first();
try {
  await item.waitFor({ timeout: 5000 });
  await item.click();
} catch {
  await page.keyboard.press('Tab');
}
```

---

## 3. High-Priority Roadmap (Phase 2 Gaps)

Refer to Legacy Parity Mapping (`archive/migration-2026/Legacy-Setup-Coverage-Mapping.md`) for details.

### 📍 Missing Environment Seeders
- **Concrete Locations:** Navigate to Project Admin -> Specifications. Add logic to `EnvironmentSetup.actions.ts`.
- **Soil Classifications:** Navigate to Admin -> Soil Classifications.
- **Financials:** Create Cost Types/Units in Admin -> General.
- **Reporting:** Implement Reports Logo upload in General Settings.

### 📄 Missing Test Seeders
- **Sieve Specifications:** Implement detailed ASTM C33 variant seeding in `EnvironmentSetup`.
- **Form Groups:** Seeding for Activity Form groups (Testing, CMT, Boring Logs).

---

## 4. Verification & Reporting

After any modification to Global Setup, YOU MUST:
1. **Run Local Probe:** `npx playwright test --grep "@E2E" --project=setup` (Ensure `DOSETUP=1` first, then `DOSETUP=0`).
2. **Review `setup-data.json`:** Ensure new variables are captured and reusable.
3. **Generate Stakeholder Report:** Update the `GlobalSetup-Analysis-Report.md` to reflect the new capabilities.

**Deliverable Success Criteria:**
- Zero `test.skip` needed for setup steps.
- Setup runs in < 60s for "warm" environments.
- 100% success rate in Headless Azure Pipelines.

---

## 5. T3-T5 Setup Considerations

### Telemetry Initialization (T3)

`GlobalLocatorTelemetry` is a singleton that auto-initializes on first import — no explicit setup required in `global-setup.ts`. However:

- `selector-usage.json` persists between runs. If you need a clean telemetry baseline, delete this file before running setup.
- The telemetry singleton resets per worker process. Cross-worker telemetry is aggregated via `selector-usage.json`.
- Global teardown (`tests/global-teardown.ts`) does NOT clean up telemetry files — this is intentional for CI analysis.

### DOM Snapshots (T4)

- `.caf-dom-snapshots/` stores DOM snapshots for drift prediction.
- Snapshots are NOT generated during global setup — they are collected during test runs.
- After environment seeding changes, run a full test suite to refresh snapshots before relying on drift predictions.
- NEVER delete `.caf-dom-snapshots/` manually — use `check:dom-drift` to manage snapshots.

### Enterprise Governance (T5)

- Release confidence scoring (`ci:release-confidence`) requires a completed test run — it cannot run during setup.
- Migration orchestrator (`migrate:run`) should NOT be used during global setup. Migrations are a separate workflow.
- Flake triage (`ci:flake-triage`) requires Playwright trace files — ensure `trace: 'retain-on-failure'` is configured in `playwright.config.ts`.

### Setup Data Integration

When adding new setup functionality that creates selectable records:

1. Store created record names in `setup-data.json` via `src/utils/setup-data.ts`
2. These names may be used by T3 telemetry for selector health tracking
3. Ensure idempotency (Section 2A) — re-running setup must not corrupt telemetry baselines

---
*Analysis prepared by CAF Migration Assistant — Agile Frameworks E2E Automation*
