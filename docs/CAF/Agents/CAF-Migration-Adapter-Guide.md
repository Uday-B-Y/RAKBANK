# CAF Migration Adapter Guide
Version: 2.0
Audience: Migration Team, AI Agents
Status: Active during POM → CAF transition

---

# 1. Purpose

This guide defines the SAFE process for migrating legacy POM into CAF.

Goal:
- Eliminate structural defects
- Prevent locator copying
- Enforce ownership model
- Maintain behavior parity

---

# 2. Migration Philosophy

DO NOT:
- Copy locators blindly
- Port XPath as-is
- Recreate POM structure
- Preserve hard waits
- Move test logic into page layer

CAF is not POM with better naming.
CAF is structural redesign.

---

# 3. Migration Steps

## Step 1 — Capture HTML Snapshot

Extract HTML from:
- Stable environment
- Fully rendered state

---

## Step 2 — Run CAF Compiler

npm run caf <html> <pageName> <domain>

This generates:
- analysis.json
- Components
- Page
- Injected locators

---

## Step 3 — Map Legacy Methods

For each legacy POM method:

Identify:
- What action it performs
- Which component it belongs to
- Whether it belongs in page or spec

Do NOT copy locators.
Use injected locators only.

---

## Step 4 — Rebuild Actions

Legacy:
clickSubmitButton()

CAF:
this.components.form.submitButton.click()

---

## Step 5 — Remove Hard Waits

Replace:
waitForTimeout(5000)

With:
await locator.waitFor()
await expect(locator).toBeVisible()

---

## Step 6 — Eliminate XPath

Replace:
page.locator('//div[3]/span')

With:
Scored selector from analysis.json

---

# 4. Parity Verification

After migration:

- Run legacy and CAF in parallel
- Compare:
  - Behavior
  - Element resolution
  - Execution timing

Parity metrics:

- Functional parity %
- Locator stability %
- Failure delta

Target: ≥ 95% behavioral parity before retiring POM.

---

# 5. Measuring Migration Progress

Track:

- % POM pages converted
- % XPath removed
- % Hard waits removed
- % CI failures reduced

---

# 6. Migration Guardrails

Migration must fail if:

- Raw locator appears in spec
- XPath appears in component
- Hard wait detected
- Duplicate ownership found

---

# 7. AI-Assisted Migration

AI may:

- Suggest component grouping
- Suggest method mapping
- Suggest wait replacement
- Suggest locator improvements

AI must NOT:

- Invent selectors
- Override scoring
- Bypass injection engine
- Auto-merge structural changes

---

# 8. Sunset Policy

POM page may be deleted only when:

- CAF equivalent passes regression
- Structural scorecard ≥ 95%
- CI stable for 3 consecutive builds

---

# 9. Migration Success Criteria

Migration complete when:

- 100% pages in CAF
- 0 XPath
- 0 hard waits
- 100% injection coverage
- CI quality gate enforced

At this point, migration governance layer is archived.

---

# 10. Enterprise Migration Orchestration (T5.4)

For enterprise-scale migrations, CAF provides an automated migration orchestrator:

Script: `scripts/migration-orchestrator.ts`

### 7-Phase State Machine

```
init → analyze → preview → apply → verify → complete → rollback
```

### Commands

```bash
npm run migrate:plan      # Analyze and plan migration phases
npm run migrate:run       # Execute migration
npm run migrate:status    # Check current phase status
npm run migrate:rollback  # Rollback to previous phase
npm run migrate           # Interactive migration assistant
```

### State Tracking

- `migration-state.json` — Current phase and progress
- `migration-log.json` — Detailed action log

### Migration Scoring

`migration-score.ts` assesses readiness before execution:
- Codebase complexity
- Test coverage of affected areas
- Number of migration targets
- Estimated risk level

Full rollback support at any phase before `complete`.