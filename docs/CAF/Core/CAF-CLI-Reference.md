# CAF CLI Reference
Version: 1.0
Created: 2026-03-17
Total Scripts: 47

---

## 1. Test Execution

| Command | Script | Purpose |
|---------|--------|---------|
| `npm test` | `playwright test` | Run all tests |
| `npm run test:ui` | `playwright test --ui` | Interactive UI mode |
| `npm run test:headed` | `playwright test --headed` | Visible browser |
| `npm run test:debug` | `playwright test --debug` | Debug with inspector |
| `npm run test:report` | `playwright show-report` | View last HTML report |
| `npm run test:allure` | `allure generate + open` | Allure report |

---

## 2. Code Generation

| Command | Script | Purpose |
|---------|--------|---------|
| `npm run caf` | `caf-cli.ts` | CAF CLI orchestrator (full pipeline) |
| `npm run new-flow` | `new-flow.ts` | Generate new CAF flow (pages/actions/fixture/test) |
| `npm run generate:full` | `caf-full-generator.ts` | Full CAF generation from analysis |
| `npm run generate-registry` | `generate-registry.ts` | Regenerate registry.md from codebase |

### CAF CLI Usage

```bash
npm run caf -- <html> <pageName> <domain>            # Safe mode (default)
npm run caf -- <html> <pageName> <domain> --dry-run   # Preview only
npm run caf -- <html> <pageName> <domain> --force     # Overwrite existing
```

---

## 3. Validation & Linting

| Command | Script | Purpose |
|---------|--------|---------|
| `npm run lint:caf` | `caf-linter.ts` | CAF architecture compliance |
| `npm run check:selectors` | `detect-unstable-selectors.ts` | Detect unstable selectors |
| `npm run check:registry` | `check-registry-conflicts.ts` | Registry conflict detection |
| `npm run check:duplicates` | `detect-duplicate-files.ts` | Duplicate file detection |
| `npm run check:governance` | `check-manual-pages.ts` | Manual page governance check |

---

## 4. Selector & Locator Analysis

| Command | Script | Purpose |
|---------|--------|---------|
| `npm run check:dom-diff` | `dom-diff-impact.ts` | DOM diff impact analysis |
| `npm run check:locator-optimize` | `locator-optimizer.ts` | Locator optimization suggestions |
| `npm run check:promotion-score` | `promotion-scoring.ts` | Selector promotion scoring |

---

## 5. Runtime Intelligence (Tier 3)

| Command | Script | Purpose |
|---------|--------|---------|
| `npm run ci:locator-score` | `locator-score-check.ts` | CI locator score validation |
| `npm run ci:fallback-check` | `fallback-threshold-check.ts` | CI fallback usage threshold |
| `npm run ci:score-demotion` | `score-updater.ts` | Auto-demote low-scoring selectors |
| `npm run ci:lifecycle` | `selector-lifecycle.ts` | Selector lifecycle management |
| `npm run ci:promotion` | `promotion-report.ts` | Selector promotion report |

### Example: Check fallback health

```bash
npm run ci:fallback-check
# Output: PASS/FAIL with fallback count per run (threshold: <=10)
```

---

## 6. Predictive Automation (Tier 4)

| Command | Script | Purpose |
|---------|--------|---------|
| `npm run check:dom-drift` | `dom-drift-predictor.ts` | DOM drift volatility prediction |
| `npm run check:cross-env` | `cross-env-compare.ts` | Cross-environment comparison |
| `npm run repair:selector` | `selector-repair.ts` | AI-assisted selector repair |
| `npm run repair:pipeline` | `auto-repair-pipeline.ts` | Full 4-stage auto-repair |

### Example: Run auto-repair pipeline

```bash
npm run repair:pipeline
# Stage 1: Drift detection
# Stage 2: Optimization analysis
# Stage 3: Repair attempts (8 strategies, auto-apply >= 90% confidence)
# Stage 4: Lifecycle management
# Output: auto-repair-report.json
```

---

## 7. Enterprise Governance (Tier 5)

| Command | Script | Purpose |
|---------|--------|---------|
| `npm run flake-triage` | `flake-triage.ts` | Local flake analysis |
| `npm run ci:flake-triage` | `flake-triage.ts --ci` | CI flake triage |
| `npm run release-confidence` | `release-confidence.ts` | Local release scoring |
| `npm run ci:release-confidence` | `release-confidence.ts --ci` | CI release scoring |
| `npm run analytics` | `azure-analytics.ts` | Local analytics dashboard |
| `npm run ci:analytics` | `azure-analytics.ts --ci` | CI analytics |
| `npm run pr-comment` | `pr-comment-bot.ts --dry-run` | PR comment dry-run |
| `npm run ci:pr-comment` | `pr-comment-bot.ts` | CI PR auto-comment |
| `npm run telemetry-feedback` | `telemetry-feedback.ts` | Collect telemetry |
| `npm run telemetry-feedback:apply` | `telemetry-feedback.ts --apply` | Apply feedback |

### Example: Check release confidence

```bash
npm run release-confidence
# Output:
# Release Confidence Score: 85
# Recommendation: GO
# Factors: test health 92%, selector stability 88%, flake control 80%...
```

---

## 8. Migration

| Command | Script | Purpose |
|---------|--------|---------|
| `npm run migrate:plan` | `migration-orchestrator.ts --plan` | Plan migration phases |
| `npm run migrate:run` | `migration-orchestrator.ts` | Execute migration |
| `npm run migrate:status` | `migration-orchestrator.ts --status` | Check phase status |
| `npm run migrate:rollback` | `migration-orchestrator.ts --rollback` | Rollback to previous phase |
| `npm run migrate` | `migration-assistant.ts` | Interactive migration |

---

## 9. CI Gate (Orchestrator)

| Command | Script | Purpose |
|---------|--------|---------|
| `npm run ci:gate` | `ci-gate.ts` | Full CI gate suite |

Runs: `lint:caf` → `check:selectors` → `check:duplicates` → `check:registry` → `check:governance` → `ci:promotion`

---

## 10. Type Checking

```bash
npx tsc --noEmit    # TypeScript compilation check (not an npm script)
```

---

## 11. Husky

| Command | Script | Purpose |
|---------|--------|---------|
| `npm run prepare` | `husky` | Install git hooks |
