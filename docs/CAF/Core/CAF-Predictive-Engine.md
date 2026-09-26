# CAF Predictive Automation Engine
Version: 1.0
Created: 2026-03-17
Tier: T4 (Predictive & Autonomous)
Status: IMPLEMENTED

---

## 1. Overview

The CAF Predictive Engine provides proactive selector management through DOM drift prediction, automated repair, and cross-environment analysis. Rather than reacting to selector failures, the predictive engine identifies at-risk selectors before they break.

```
DOM Snapshots (.caf-dom-snapshots/)
    ↓
DOM Drift Predictor (volatility scoring)
    ↓
┌─────────────────────────────────────────────────┐
│  Auto-Repair Pipeline (4 stages)                │
│  Stage 1: Drift Detection                       │
│  Stage 2: Optimization Analysis                 │
│  Stage 3: Repair Attempts (8 strategies)        │
│  Stage 4: Lifecycle Management                  │
└─────────────────────────────────────────────────┘
    ↓
auto-repair-report.json + .caf-repair-log.json
    ↓
CI Validation → Merge / Manual Review
```

---

## 2. DOM Drift Detection

### 2.1 DOM Drift Predictor (`scripts/dom-drift-predictor.ts`)

Tracks selector history across DOM snapshots to predict instability.

**Input**: DOM snapshots stored in `.caf-dom-snapshots/`

**Algorithm**:
- Compares current DOM against historical snapshots
- Computes per-selector **volatility score** (0–1)
- Tracks **change frequency** across snapshots
- Calculates **confidence** (0–100%) based on data points

**Risk Levels**:

| Volatility Score | Risk Level | Action |
|-----------------|------------|--------|
| 0 – 0.3 | Low | No action needed |
| 0.3 – 0.5 | Medium | Monitor; consider optimization |
| 0.5 – 0.7 | High | Schedule repair |
| 0.7 – 1.0 | Critical | Immediate repair recommended |

**CLI**: `npm run check:dom-drift`

### 2.2 DOM Diff Impact Analysis (`scripts/dom-diff-impact.ts`)

Analyzes the impact of DOM structure changes on existing selectors:

- Computes DOM diff between two snapshots
- Identifies which selectors are affected by changes
- Quantifies impact severity

**CLI**: `npm run check:dom-diff`

---

## 3. Auto-Repair Pipeline

### 3.1 Pipeline Architecture (`scripts/auto-repair-pipeline.ts`)

Orchestrates 4 sequential stages:

**Stage 1: Drift Detection**
- Runs DOM volatility analysis
- Identifies selectors at risk
- Prioritizes by risk level

**Stage 2: Optimization Analysis**
- Evaluates selectors against optimization rules
- Suggests improvements (e.g., replace XPath with data-testid)
- Scores optimization candidates

**Stage 3: Repair Attempts**
- Generates repair candidates using 8 strategies
- Scores each candidate with confidence + similarity metrics
- Auto-applies if confidence >= 90%
- Flags for manual review if confidence < 90%

**Stage 4: Lifecycle Management**
- Retires unrepairable selectors
- Updates selector lifecycle states
- Cleans up deprecated selectors past grace period

**Output**: `auto-repair-report.json` with:
- Actions taken (auto-applied vs manual-required)
- Summary statistics
- Repair confidence scores

**CLI**: `npm run repair:pipeline`

### 3.2 Selector Repair Engine (`scripts/selector-repair.ts`)

The core repair engine that generates and scores repair candidates.

**8 Repair Strategies** (in priority order):

| # | Strategy | Target |
|---|----------|--------|
| 1 | dataTestId | `[data-testid="..."]` |
| 2 | id | `#elementId` |
| 3 | ariaLabel | `[aria-label="..."]` |
| 4 | role | `getByRole(...)` |
| 5 | name | `[name="..."]` |
| 6 | placeholder | `[placeholder="..."]` |
| 7 | text | `getByText(...)` |
| 8 | class | `.className` |

**Scoring**:
- Each candidate receives a **confidence score** (0–100%)
- Each candidate receives a **similarity score** (0–100%) comparing to original
- Auto-apply threshold: **>= 90% confidence**

**Repair Log**: All repair attempts are logged in `.caf-repair-log.json`:
```json
{
  "selectorId": "...",
  "originalSelector": "...",
  "repairedSelector": "...",
  "strategy": "dataTestId",
  "confidence": 95,
  "autoApplied": true,
  "timestamp": "2026-03-17T..."
}
```

**CLI**: `npm run repair:selector`

---

## 4. Cross-Environment Analysis

### 4.1 Cross-Environment Comparison (`scripts/cross-env-compare.ts`)

Compares selector resolution across different environments:

**Purpose**: Detect selectors that work in staging but fail in production (or vice versa)

**Metrics**:
- Selector resolution success rate per environment
- Variance percentage between environments
- Divergent selectors list

**Threshold**: Alert if variance > 10%

**CLI**: `npm run check:cross-env`

---

## 5. Locator Optimization

### 5.1 Locator Optimizer (`scripts/locator-optimizer.ts`)

Analyzes existing selectors against optimization rules and suggests improvements.

**Optimization opportunities detected**:
- XPath selectors that could use data-testid
- ID selectors with dynamic patterns
- Class selectors with poor specificity
- Redundant selector chains

**CLI**: `npm run check:locator-optimize`

### 5.2 Promotion Scoring (`scripts/promotion-scoring.ts`)

Scores selectors for promotion eligibility:
- Combines telemetry data (T3) with predictive analysis (T4)
- Higher scores indicate safer promotion candidates

**CLI**: `npm run check:promotion-score`

---

## 6. Data Flow

```
DOM Snapshots → dom-drift-predictor.ts → Volatility Scores
                                              ↓
                                    auto-repair-pipeline.ts
                                        ↓           ↓
                              selector-repair.ts   locator-optimizer.ts
                                        ↓           ↓
                                 .caf-repair-log.json
                                        ↓
                              auto-repair-report.json
                                        ↓
                              CI Validation (ci:gate)
                                        ↓
                              release-confidence.ts (T5)
```

---

## 7. CI Integration

| Script | CI Command | Gate Behavior |
|--------|-----------|---------------|
| `dom-drift-predictor.ts` | `npm run check:dom-drift` | Alert on critical risk |
| `auto-repair-pipeline.ts` | `npm run repair:pipeline` | Report only (no auto-merge) |
| `selector-repair.ts` | `npm run repair:selector` | Auto-apply >= 90% confidence |
| `cross-env-compare.ts` | `npm run check:cross-env` | Alert if variance > 10% |
| `locator-optimizer.ts` | `npm run check:locator-optimize` | Suggestions only |

---

## 8. Architecture Invariants

- Auto-repair MUST NOT merge without CI validation
- Confidence threshold (90%) for auto-apply MUST NOT be lowered without governance approval
- DOM snapshots MUST be preserved for audit trail
- Repair log MUST be maintained for all repair attempts
- Cross-environment data MUST NOT contain credentials or secrets
- Volatility scores are advisory; they do not block merges alone
