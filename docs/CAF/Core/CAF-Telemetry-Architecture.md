# CAF Telemetry Architecture
Version: 1.0
Created: 2026-03-17
Tier: T3 (Runtime Intelligence)
Status: IMPLEMENTED

---

## 1. Overview

The CAF Telemetry Architecture provides runtime intelligence for selector health monitoring, automated score management, and data-driven optimization. Telemetry data flows from test execution through collection, storage, analysis, and action.

```
Test Execution
    ↓
FallbackLocator (records resolution attempts)
    ↓
GlobalLocatorTelemetry (in-memory aggregation)
    ↓
selector-usage.json (persistent storage)
    ↓
┌─────────────────────────────────────────────┐
│  Downstream Consumers                       │
│  ├─ Score Demotion (score-updater.ts)       │
│  ├─ Selector Lifecycle (selector-lifecycle) │
│  ├─ Promotion Report (promotion-report.ts)  │
│  ├─ Selector Heatmap (selector-heatmap.ts)  │
│  └─ Flake Triage (flake-triage.ts)          │
└─────────────────────────────────────────────┘
    ↓
CI Gates & Enterprise Dashboard
```

---

## 2. Data Collection Layer

### 2.1 FallbackLocator (`src/core/locators/FallbackLocator.ts`)

The primary telemetry collection point. During test execution:

1. Receives a list of selector candidates (primary + fallbacks)
2. Consults `GlobalLocatorTelemetry` to check if selector order should be adjusted
3. Attempts resolution in order (primary first, then fallbacks)
4. Records resolution result:
   - Which selector succeeded
   - Whether fallback was used
   - Resolution duration (ms)
5. Reports result back to `GlobalLocatorTelemetry`

### 2.2 GlobalLocatorTelemetry (`src/core/telemetry/locator-telemetry.ts`)

In-memory telemetry aggregator. Singleton instance tracks:

| Field | Type | Purpose |
|-------|------|---------|
| `totalRuns` | number | Total resolution attempts per selector |
| `fallbackRuns` | number | Times fallback was activated |
| `fallbackRate` | number | Computed: fallbackRuns / totalRuns |

Key methods:
- `recordResolution(selectorId, usedFallback)` — Record a resolution attempt
- `shouldPromoteFallback(selectorId)` — Promotion decision algorithm
- `getHealth(selectorId)` — Get selector health summary
- `getAllStats()` — Export all telemetry data

### 2.3 Promotion Algorithm

```
if (fallbackRate > 0.40 && totalRuns >= 3) {
  // Promote: swap fallback to primary position
  return true;
}
```

This means: if a fallback selector succeeds more than 40% of the time after at least 3 attempts, the fallback should be promoted to primary.

---

## 3. Storage Layer

### 3.1 In-Memory Storage

`GlobalLocatorTelemetry` maintains a Map of selector stats during the test run. Data is available for real-time decisions (e.g., FallbackLocator reordering).

### 3.2 Persistent Storage (`src/core/telemetry/selector-usage.ts`)

Writes telemetry to `selector-usage.json` at the project root:

```json
{
  "selectorId": {
    "totalRuns": 15,
    "fallbackRuns": 3,
    "fallbackRate": 0.2,
    "lastRun": "2026-03-17T10:30:00Z"
  }
}
```

This file is:
- Written after test execution completes
- Read by downstream CI scripts for analysis
- Not committed to version control (generated artifact)

---

## 4. Downstream Consumers

### 4.1 Score Demotion (`scripts/score-updater.ts`)

Reads telemetry data and demotes selectors with high fallback rates:
- Input: `selector-usage.json`
- Action: Reduce selector score, recalculate tier
- Output: Updated scores, CI warning if threshold exceeded
- CI command: `npm run ci:score-demotion`

### 4.2 Selector Lifecycle (`scripts/selector-lifecycle.ts`)

Manages selector state transitions based on telemetry:
- `active → watch`: Fallback rate exceeds monitoring threshold
- `watch → deprecated`: Sustained degradation
- `deprecated → retired`: Grace period expired
- CI command: `npm run ci:lifecycle`
- State stored in: `.caf-selector-lifecycle.json`

### 4.3 Promotion Report (`scripts/promotion-report.ts`)

Generates promotion eligibility report:
- Identifies selectors where fallback consistently outperforms primary
- Recommends promotion candidates
- CI command: `npm run ci:promotion`

### 4.4 Selector Heatmap (`scripts/selector-heatmap.ts`)

Maps usage frequency:
- Identifies hot selectors (frequently used)
- Identifies cold selectors (rarely used, candidates for retirement)
- Output used by Azure analytics dashboard

### 4.5 Flake Telemetry (`scripts/flake-telemetry.ts`)

Records flake metadata:
- Correlates test failures with selector telemetry
- Identifies selector-caused flakes vs timeout/network flakes
- Feeds into `flake-triage.ts` for categorization

---

## 5. CI Integration

### 5.1 Fallback Threshold Check

Script: `scripts/fallback-threshold-check.ts`
CI command: `npm run ci:fallback-check`

Gate: Fail if fallback usage > 10 per run (configurable)

### 5.2 Score Demotion

Script: `scripts/score-updater.ts`
CI command: `npm run ci:score-demotion`

Action: Auto-demotes selectors exceeding fallback threshold

### 5.3 Lifecycle Enforcement

Script: `scripts/selector-lifecycle.ts`
CI command: `npm run ci:lifecycle`

Action: Enforces lifecycle transitions, warns on deprecated selectors

### 5.4 Promotion Reporting

Script: `scripts/promotion-report.ts`
CI command: `npm run ci:promotion`

Output: Promotion candidates with confidence scores

---

## 6. Configuration

| Parameter | Default | Location |
|-----------|---------|----------|
| Fallback threshold (CI) | 10 per run | `fallback-threshold-check.ts` |
| Promotion trigger rate | 40% | `locator-telemetry.ts` |
| Minimum runs for promotion | 3 | `locator-telemetry.ts` |
| Score demotion decrement | Configurable | `score-updater.ts` |
| Lifecycle grace period | Configurable | `selector-lifecycle.ts` |

---

## 7. Reporting Integration

Telemetry data flows into the T5 enterprise dashboard:

| Report | Script | Data Source |
|--------|--------|------------|
| Fallback usage trend | `azure-analytics.ts` | `selector-usage.json` |
| Selector health heatmap | `selector-heatmap.ts` | `selector-usage.json` |
| Promotion candidates | `promotion-report.ts` | `selector-usage.json` |
| Flake correlation | `flake-triage.ts` | `flake-telemetry.ts` output |
| Release confidence factor | `release-confidence.ts` | Aggregated telemetry |

---

## 8. Architecture Invariants

- Telemetry collection MUST NOT affect test execution timing
- Telemetry data MUST NOT be committed to version control
- Promotion decisions MUST require CI validation
- Score demotion MUST be logged and auditable
- Lifecycle transitions MUST respect grace periods
