# CAF Enterprise Governance
Version: 1.0
Created: 2026-03-17
Tier: T5 (Enterprise)
Status: IMPLEMENTED

---

## 1. Overview

The CAF Enterprise Governance layer provides organization-scale automation management including release readiness scoring, CI/CD analytics, automated PR feedback, flake management, migration orchestration, and telemetry feedback loops.

```
T3 Telemetry + T4 Predictive Data
    ↓
┌──────────────────────────────────────────────┐
│  Enterprise Governance Systems               │
│  ├─ Release Confidence Scoring               │
│  ├─ Azure Analytics Dashboard                │
│  ├─ PR Auto-Comment Bot                      │
│  ├─ Flake Auto-Triage                        │
│  ├─ Migration Orchestration                  │
│  ├─ Telemetry Feedback Loop                  │
│  └─ Health Report Generation                 │
└──────────────────────────────────────────────┘
    ↓
Dashboards, PR Comments, Release Decisions
```

---

## 2. Release Confidence Scoring

### Script: `scripts/release-confidence.ts`

Multi-factor algorithm that produces a GO / CAUTION / NO-GO recommendation for releases.

### Weighted Factors

| Factor | Weight | Data Source |
|--------|--------|------------|
| Test health | 30% | Test execution results |
| Selector stability | 25% | `locator-score-check.ts` |
| Flake control | 20% | `flake-triage.ts` |
| Fallback health | 15% | `fallback-threshold-check.ts` |
| Promotion readiness | 10% | `promotion-scoring.ts` |

### Scoring Thresholds

| Score | Recommendation | Action |
|-------|---------------|--------|
| >= 80 | **GO** | Safe to release |
| 60 – 79 | **CAUTION** | Release with monitoring |
| < 60 | **NO-GO** | Block release; address issues |

### Output

The script generates a report including:
- Overall confidence score
- Per-factor breakdown
- Blockers (issues that must be resolved)
- Warnings (issues to monitor)

### CLI Commands

```bash
npm run release-confidence          # Local analysis
npm run ci:release-confidence       # CI mode (exits with error code on NO-GO)
```

---

## 3. Azure Analytics Dashboard

### Script: `scripts/azure-analytics.ts`

Generates an HTML analytics dashboard with Chart.js visualizations for integration with Azure DevOps.

### Dashboard Panels

| Panel | Visualization | Data |
|-------|--------------|------|
| Selector quality distribution | Bar chart | Gold/Silver/Bronze tier counts |
| Fallback usage trend | Line chart | Fallback rate over time |
| Drift volatility | Heatmap | Per-selector volatility scores |
| Release confidence | Gauge | Current confidence score |
| Flake classification | Pie chart | Flake types breakdown |
| Auto-repair activity | Timeline | Repair attempts and results |
| Promotion candidates | Table | Selectors eligible for promotion |
| Test health trend | Line chart | Pass/fail rates over time |

### CLI Commands

```bash
npm run analytics                   # Local dashboard generation
npm run ci:analytics                # CI mode (uploads as artifact)
```

---

## 4. PR Auto-Comment Bot

### Script: `scripts/pr-comment-bot.ts`

Automatically comments on pull requests with CAF quality metrics and recommendations.

### Comment Structure

```markdown
## CAF Quality Report

### Selector Metrics
- Average score: 89 (threshold: 85) ✅
- Gold tier: 72% (threshold: 60%) ✅
- Fallback rate: 3.2% (threshold: 10%) ✅

### Architecture Compliance
- Spec purity: 100% ✅
- Component encapsulation: 100% ✅

### Recommendations
- 2 selectors approaching watch state
- 1 optimization opportunity detected

### Release Confidence: 85 (GO)
```

### Platform Support

- GitHub (via GitHub API)
- Azure DevOps (via Azure API)

### CLI Commands

```bash
npm run pr-comment                  # Dry-run (prints to console)
npm run ci:pr-comment               # CI mode (posts to PR)
```

---

## 5. Flake Auto-Triage

### Scripts: `scripts/flake-triage.ts`, `scripts/flake-classifier.ts`

Trace-based flake analysis that identifies root causes and suggests remediation.

### Flake Categories

| Category | Description | Auto-fixable |
|----------|------------|-------------|
| selector | Selector resolution failure | Often yes (via repair) |
| timeout | Operation exceeded timeout | Sometimes |
| network | API/network failure | Usually no |
| assertion | Assertion value mismatch | Usually no |

### Triage Process

1. Parse test trace files
2. Correlate failures with selector telemetry
3. Classify root cause (selector/timeout/network/assertion)
4. Score auto-fixability
5. Generate remediation suggestions

### Threshold

Alert if auto-fixable rate > 20% — this suggests a systemic issue requiring architectural attention rather than individual fixes.

### CLI Commands

```bash
npm run flake-triage                # Local analysis
npm run ci:flake-triage             # CI mode (with exit codes)
```

---

## 6. Migration Orchestration

### Scripts: `scripts/migration-orchestrator.ts`, `scripts/migration-assistant.ts`, `scripts/migration-score.ts`

Enterprise-scale migration engine with full rollback support.

### 7-Phase State Machine

```
init → analyze → preview → apply → verify → complete → rollback
```

| Phase | Purpose | Rollback |
|-------|---------|----------|
| init | Initialize migration context | N/A |
| analyze | Scan codebase for migration targets | Yes |
| preview | Generate diff preview | Yes |
| apply | Apply migration changes | Yes |
| verify | Run validation (tsc, lint, tests) | Yes |
| complete | Finalize migration | No (committed) |
| rollback | Revert to previous state | N/A |

### State Tracking

- `migration-state.json` — Current phase and progress
- `migration-log.json` — Detailed action log

### Migration Scoring

`migration-score.ts` assesses migration readiness:
- Codebase complexity
- Test coverage of affected areas
- Number of migration targets
- Estimated risk

### CLI Commands

```bash
npm run migrate:plan                # Plan migration (analyze phase)
npm run migrate:run                 # Execute migration
npm run migrate:status              # Check current phase
npm run migrate:rollback            # Rollback to previous phase
npm run migrate                     # Interactive migration assistant
```

---

## 7. Telemetry Feedback Loop

### Script: `scripts/telemetry-feedback.ts`

Closes the loop between production behavior and selector governance.

### Feedback Flow

```
Production Test Execution
    ↓
Telemetry Collection (selector-usage.json)
    ↓
Feedback Analysis (telemetry-feedback.ts)
    ↓
Score Adjustments (automatic)
    ↓
Promotion/Demotion Triggers
    ↓
Next CI Cycle (updated governance state)
```

### Modes

| Mode | Command | Action |
|------|---------|--------|
| Collect | `npm run telemetry-feedback` | Gather and analyze telemetry |
| Apply | `npm run telemetry-feedback:apply` | Apply recommended adjustments |

### Safety

- Adjustments are logged and auditable
- Apply mode requires explicit invocation (not automatic)
- Score changes are bounded (no extreme jumps)

---

## 8. Health Report Generation

### Scripts: `scripts/generate-health-report.ts`, `scripts/export-metrics.ts`

Generates comprehensive automation health metrics.

### Report Contents

- Overall automation health score
- Per-module test stability
- Selector quality trends
- Fallback usage patterns
- Flake frequency and classification
- Migration progress (if active)
- Recommendations for improvement

### Export Formats

`export-metrics.ts` supports exporting metrics for external consumption (dashboards, reporting tools).

---

## 9. CI Integration Summary

| System | Script | CI Command | Gate |
|--------|--------|-----------|------|
| Release Confidence | `release-confidence.ts` | `ci:release-confidence` | Fail on NO-GO |
| Analytics | `azure-analytics.ts` | `ci:analytics` | Report only |
| PR Comments | `pr-comment-bot.ts` | `ci:pr-comment` | Report only |
| Flake Triage | `flake-triage.ts` | `ci:flake-triage` | Warn on high auto-fixable |
| Health Report | `generate-health-report.ts` | Via `ci:gate` | Report only |

---

## 10. Architecture Invariants

- Release confidence scoring CANNOT be bypassed
- Migration phases CANNOT be skipped
- Rollback capability MUST be preserved
- PR comments MUST NOT contain sensitive data (credentials, tokens)
- Analytics dashboard MUST NOT expose internal paths or secrets
- Flake auto-classification does NOT replace manual review
- Telemetry feedback adjustments MUST be bounded and auditable
