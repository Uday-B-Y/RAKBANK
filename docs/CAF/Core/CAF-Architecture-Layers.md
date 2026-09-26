# CAF Architecture Layers
Version: 3.0
Updated: 2026-03-17
Status: All tiers (T0–T5) IMPLEMENTED

---

## 1. High-Level Architecture

CAF operates on two parallel pipelines:

### Generation Pipeline (DOM → Code)

```
HTML Snapshot → DOM Compiler → analysis.json → Generator → Locator Injector → Components + Pages
```

### Execution Pipeline (Tests → Core)

```
Tests (specs) → Fixtures (setup/auth) → Actions (business flows) → Pages (UI composition) → Components (locators) → Core (base classes + sync)
```

### Runtime Intelligence Pipeline (T3–T5)

```
Test Execution → Fallback Telemetry → Selector Lifecycle → Score Demotion/Promotion
                                    → DOM Drift Prediction → Auto-Repair Pipeline
                                    → Flake Triage → Release Confidence → Enterprise Dashboard
```

---

## 2. Generation Pipeline Layers

> **Actual pipeline order** (as implemented in `caf-cli.ts`):
> DOM Compilation → Quality Gate (fail-fast) → Segment Deduplication → Full Generation → Locator Injection

### 2.1 DOM Compiler

Input: HTML
Output: analysis.json

Responsibilities:
- Extract selectors from DOM structure
- Score selectors (gold/silver/bronze tiers)
- Classify tier based on stability metrics
- Detect dynamic IDs (zero tolerance)
- Enforce diversity metrics (no strategy >95%)
- Build segment signatures for component boundaries

Scripts: `dom-compiler.ts`, `dom-normalizer.ts`, `dom-segmenter.ts`, `selector-inventory.ts`

---

### 2.2 Quality Gate (fail-fast)

Runs immediately after DOM compilation, before generation. Blocks the pipeline if quality thresholds are not met.

Script: `quality-gate.ts`

---

### 2.3 Generator

Input: analysis.json
Output: Components, Pages, Registry

Rules:
- No locator injection (separate stage)
- No mutation of analysis.json
- Deterministic naming (same input = same output)
- Ownership model applied (component owns inside root, page owns outside)

Scripts: `caf-full-generator.ts`, `generate-registry.ts`

> **Note:** `caf-generator.ts` is a legacy generator (pre-component pattern) retained for backward compatibility. Use `caf-full-generator.ts` for new generation.
> **Note:** `batch-generator.ts` is an analysis-only tool that writes raw selector/segment JSON to `migration-output/` without running the quality gate or generation stages.

---

### 2.4 Locator Injector

Input: analysis.json + Component roots + Page files
Output: Strongly typed locator properties

Responsibilities:
- Assign selectors to correct owner (component or page)
- Inject `readonly` typed locator properties
- Track coverage percentage
- Fail if unowned selectors exist (0 tolerance)

Script: `locator-injection.ts`

---

## 3. Execution Pipeline Layers

### 3.1 Test Layer (Specs)

Location: `tests/**/*.spec.ts`
Count: 31 spec files

Rules:
- Import `test` from fixture, NOT from `@playwright/test`
- Call actions and make assertions via `expect()`
- No direct locators, no `page.click`, no waits, no API calls, no loops

### 3.2 Fixture Layer

Location: `src/fixtures/`
Count: 32 fixture files

Rules:
- Wire pages → actions → test context
- Setup/teardown lifecycle
- One fixture per feature
- No test logic

### 3.3 Action Layer

Location: `src/actions/`
Count: 66 action files

Rules:
- Business flows (5-15 lines per method)
- Use `runWithNetwork()` for API synchronization
- Assertions via `expect()` are permitted here
- No exposing locators to tests

> **Assertions layer:** `src/assertions/` mirrors the actions structure, organized by domain module. Assertions are injected via fixtures alongside actions.

### 3.4 Page Layer

Location: `src/pages/`
Count: 89 page files

Rules:
- Aggregate components
- Contain page-owned locators (outside component roots)
- Expose UI interaction methods
- No raw selector strings, no business logic, no assertions

### 3.5 Component Layer

Location: `src/components/`
Count: 209 component files

Rules:
- Must extend `BaseComponent`
- Must define `root` locator
- Locators scoped to root
- No cross-component access
- No business logic, no assertions

### 3.6 Core Layer

Location: `src/core/`

| Module | Files | Purpose |
|--------|-------|---------|
| `base/` | BasePage, BaseAction, BaseComponent | Base class hierarchy |
| `sync/` | NetworkWatcher, AzureKeepAlive, LocatorHealer | Synchronization and resilience |
| `locators/` | FallbackLocator | Intelligent locator with telemetry |
| `telemetry/` | locator-telemetry, selector-usage | Runtime telemetry collection |

### 3.7 Reporting Subsystem

Location: `src/reporting/`
Count: 3 files

A Playwright Reporter integration that collects runtime test metrics and feeds downstream analysis.

| File | Purpose |
|------|---------|
| `metrics.collector.ts` | Playwright `Reporter` implementation — records test title, status, duration, retries per test; writes `reports/metrics.json` at run end |
| `flake.detector.ts` | Filters test results for flakiness indicators (retries > 0 or duration > 60 s); writes `reports/flaky.json` |
| `heatmap.collector.ts` | Records per-file execution duration to `reports/heatmap.json` for hotspot analysis |

Rules:
- `MetricsCollector` is registered as a Playwright reporter in `playwright.config.ts`
- Output files live in `reports/` (gitignored), not in `src/`
- No direct dependency on `src/` test code — operates via Playwright reporter API

### 3.8 Utilities Layer

Location: `src/utils/`
Count: 11 files

Shared utilities consumed across all execution layers.

| File | Category | Purpose |
|------|----------|---------|
| `setup-data.ts` | Setup | Generates/persists unique test data seeds; atomic writes; environment-bound via hash |
| `setup-manifest.ts` | Setup | Audit record written at end of global setup (mode, timing, success) |
| `env-validator.ts` | Setup | Phase 0 fail-fast validation of required env vars before browser launch |
| `constants.ts` | Config | Loads test data from `setup-data.json` with env-var fallback; exports domain-specific test data getters |
| `env.ts` | Config | Loads `.env` via dotenv; exports `BASE_URL`, `ENVIRONMENT`, `CI` flags |
| `config.ts` | Config | Wraps env settings with timeout constants (action 30 s, navigation 60 s, API 30 s) |
| `routes.ts` | Config | Centralized URL path constants for admin/project admin pages |
| `DataGridHelper.ts` | UI | MUI DataGrid row extraction with virtual-scroll handling (deduped, stagnation detection) |
| `helpers.ts` | UI | Reusable interaction helpers (`typeThenHitEnter`, `waitForGridCover`, etc.) |
| `fileUtils.ts` | File | File reading and CSV column cleaning for download verification |
| `logger.ts` | Logging | Timestamped logger (info/warn/error/debug); debug respects `DEBUG` env var |

> **Note:** `DOMCapture.ts` also resides in `src/utils/` but is a standalone Playwright snapshot script, not a shared utility. It is a candidate for relocation to `scripts/`.

---

## 4. CI Governance Layer

Must enforce:
- Selector quality threshold (avg score >= 85)
- Diversity threshold (no strategy > 95%)
- Fallback usage threshold (<= 10 per run)
- Duplicate ownership detection (0 unowned)
- Registry conflict detection
- Structure integrity (no locators in specs)
- Determinism (generator idempotency)

Scripts: `ci-gate.ts`, `caf-linter.ts`, `quality-gate.ts`, `check-registry-conflicts.ts`

Actual CI pipeline (`.azurepipelines/`):
1. `npm run lint:caf` — CAF architecture linter
2. `npm run ci:gate` — Full governance gate
3. `npm run ci:locator-score` — Locator score validation
4. `npm run ci:fallback-check` — Fallback usage check

---

## 5. Runtime Intelligence Layer (Tier 3) — IMPLEMENTED

### 5.1 Fallback Telemetry

Tracks selector resolution at runtime:
- Records which selectors fall back to alternatives
- Measures fallback rate per selector
- Persists data to `selector-usage.json`

Files: `src/core/telemetry/locator-telemetry.ts`, `src/core/locators/FallbackLocator.ts`

### 5.2 Score Demotion

Automatically reduces selector scores when fallback rate exceeds threshold:
- Recalculates tier (gold → silver → bronze)
- Triggers CI warning

Script: `score-updater.ts`

### 5.3 Selector Lifecycle

State machine: `active → watch → deprecated → retired`
- Driven by telemetry data and usage frequency
- Retirement requires grace period

Script: `selector-lifecycle.ts`

### 5.4 Intelligent Promotion

If a fallback selector consistently succeeds (>40% fallback rate after 3+ runs):
- Promote fallback to primary
- Log mutation event
- Require CI validation

Scripts: `promotion-scoring.ts`, `promotion-report.ts`

### 5.5 Flake Classification

Categorizes test failures: selector, timeout, network, assertion
- Tracks auto-fixability

Scripts: `flake-telemetry.ts`, `flake-classifier.ts`

### 5.6 Selector Heatmap

Maps selector usage frequency across test runs for optimization targeting.

Script: `selector-heatmap.ts`

---

## 6. Predictive Automation Layer (Tier 4) — IMPLEMENTED

### 6.1 DOM Drift Prediction

Tracks selector history across DOM snapshots:
- Computes volatility score (0–1) per selector
- Predicts risk level: low | medium | high | critical
- Tracks change frequency and confidence (0–100%)
- Uses snapshots in `.caf-dom-snapshots/`

Script: `dom-drift-predictor.ts`

### 6.2 Auto-Repair Pipeline

4-stage orchestrated repair:
1. **Drift detection** — DOM volatility analysis
2. **Optimization analysis** — Locator improvement opportunities
3. **Repair attempts** — 8 strategies (dataTestId, id, ariaLabel, role, name, placeholder, text, class)
4. **Lifecycle management** — Retire unrepairable selectors

Auto-applies repairs if confidence >= 90%. Generates `auto-repair-report.json`.

Script: `auto-repair-pipeline.ts`, `selector-repair.ts`

### 6.3 DOM Diff Impact Analysis

Computes selector impact when DOM structure changes between versions.

Script: `dom-diff-impact.ts`

### 6.4 Cross-Environment Comparison

Compares selector resolution across environments (e.g., staging vs production):
- Detects variance
- Alerts if delta > configured threshold

Script: `cross-env-compare.ts`

### 6.5 Locator Optimization

Analyzes selectors against optimization rules and suggests improvements.

Script: `locator-optimizer.ts`

---

## 7. Enterprise Governance Layer (Tier 5) — IMPLEMENTED

### 7.1 Release Confidence Scoring

Multi-factor scoring algorithm:
- Test health (30%)
- Selector stability (25%)
- Flake control (20%)
- Fallback health (15%)
- Promotion readiness (10%)

Generates recommendation: **GO** | **CAUTION** | **NO-GO**

Script: `release-confidence.ts`

### 7.2 Azure Analytics Dashboard

Generates HTML analytics dashboard with Chart.js visualizations for Azure DevOps integration.

Script: `azure-analytics.ts`

### 7.3 PR Auto-Comment Bot

Automatically comments on PRs with:
- Selector quality summary
- Fallback usage stats
- Architecture compliance status
- Recommendations

Supports GitHub and Azure DevOps.

Script: `pr-comment-bot.ts`

### 7.4 Flake Auto-Triage

Trace-based flake analysis:
- Parses test traces to identify root cause
- Categorizes: selector, timeout, network, assertion
- Tracks auto-fixability
- Generates remediation suggestions

Script: `flake-triage.ts`

### 7.5 Migration Orchestration

7-phase state machine: `init → analyze → preview → apply → verify → complete → rollback`
- Tracks migration progress via `migration-state.json` and `migration-log.json`
- Full rollback support at any phase

Scripts: `migration-orchestrator.ts`, `migration-assistant.ts`, `migration-score.ts`

### 7.6 Telemetry Feedback Loop

Collects post-production telemetry and feeds it back into the selector governance system:
- Auto-triggers score adjustments
- Informs promotion/demotion decisions

Script: `telemetry-feedback.ts`

### 7.7 Health Report Generation

Generates comprehensive automation health metrics for dashboards and reporting.

Scripts: `generate-health-report.ts`, `export-metrics.ts`

---

## 8. Scripts Inventory

Location: `scripts/`
Count: 54 files

Scripts are organized by tier in the protected scripts list (`Framework-Guardrails.md`). The following auxiliary scripts are not tier-protected but support the pipeline:

| Script | Category | Purpose |
|--------|----------|---------|
| `batch-compile.ts` | Generation | Batch DOM compilation across multiple HTML files |
| `batch-generator.ts` | Analysis | Analysis-only tool; writes raw selector/segment JSON to `migration-output/` |
| `caf-generator.ts` | Legacy | Pre-component generator retained for backward compatibility (use `caf-full-generator.ts`) |
| `caf-linter.ts` | Governance | CAF architecture pattern linter |
| `detect-duplicate-files.ts` | Quality | Detects duplicate page/component files |
| `detect-unstable-selectors.ts` | Quality | Identifies selectors at risk of instability |
| `dom-diff.ts` | Analysis | Raw DOM diffing between snapshots |
| `extract-components.ts` | Generation | Extracts component boundaries from segments |
| `flake-classifier.ts` | Telemetry | Categorizes flake types (selector, timeout, network, assertion) |
| `gen-component.ts` | Generation | Single component code generation |
| `generate-locator-heatmap.ts` | Analysis | Generates locator usage heatmap visualization |
| `locator-score.ts` | Scoring | Core selector scoring algorithm |
| `locator-score-check.ts` | CI | CI-mode locator score validation |
| `migration-score.ts` | Migration | Computes migration readiness scores |
| `new-flow.ts` | Scaffolding | Generates new CAF flow (page + action + fixture + test) |
