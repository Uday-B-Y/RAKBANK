# CAF CI Governance
Version: 3.0
Updated: 2026-03-17
Status: Mandatory in protected branches | T0–T5 gates active

---

# 1. Purpose

CI is the enforcement arm of CAF.

No structural integrity → no merge.

CI must prevent:
- Low-quality selectors
- Locator leakage into specs
- Duplicate ownership
- Generator drift
- Injection failure
- Fallback abuse
- Registry conflicts
- DOM drift risks (T4)
- Release confidence failures (T5)

---

# 2. Required CI Gates

## 2.1 Selector Quality Gate (T0)

Script: `quality-gate.ts`

Fail if:
- Average score < 85
- Gold < 60%
- Bronze > 10%
- Dynamic IDs present
- Strategy dominance > 95% (98% active threshold)

---

## 2.2 Injection Coverage Gate (T1)

Script: `locator-injection.ts`

Fail if:
- Unowned selectors > 0
- Injection coverage < 100%
- Duplicate property names detected

---

## 2.3 Structure Integrity Gate (T0)

Script: `caf-linter.ts`

Fail if:
- Locator found inside spec file
- Component missing root
- Component not extending BaseComponent
- Page manually created outside generator
- Duplicate page in registry

---

## 2.4 Determinism Gate (T1)

Run generator twice in CI:

If file diff detected → fail.

Prevents nondeterministic generation.

---

## 2.5 Runtime Telemetry Gate (T3) — IMPLEMENTED

Script: `fallback-threshold-check.ts`

Fail if:
- Fallback usage > 10 per run (active threshold)
- Flake classification ratio > configured threshold
- Selector demotion threshold exceeded

Additional T3 CI scripts:
- `ci:score-demotion` — Auto-demote low-scoring selectors
- `ci:lifecycle` — Enforce selector lifecycle transitions
- `ci:promotion` — Generate promotion eligibility report

---

## 2.6 Cross-Environment Drift Gate (T4) — IMPLEMENTED

Script: `cross-env-compare.ts`

Compare:
- Stage vs Prod selector resolution
- Drift ratio > 10% → block promotion
- Alert on high-volatility selectors

Additional T4 CI scripts:
- `check:dom-drift` — DOM drift volatility prediction
- `repair:pipeline` — 4-stage auto-repair (drift → optimize → repair → lifecycle)
- `repair:selector` — Individual selector repair (8 strategies, 90% confidence auto-apply)

---

## 2.7 Enterprise Governance Gate (T5) — IMPLEMENTED

### Release Confidence Gate

Script: `release-confidence.ts`

Fail if:
- Release confidence score < 60 (NO-GO)
- Warn if score 60–79 (CAUTION)
- Pass if score >= 80 (GO)

Weighted factors:
| Factor | Weight |
|--------|--------|
| Test health | 30% |
| Selector stability | 25% |
| Flake control | 20% |
| Fallback health | 15% |
| Promotion readiness | 10% |

### Flake Triage Gate

Script: `flake-triage.ts --ci`

- Categorizes flakes: selector, timeout, network, assertion
- Alerts if auto-fixable rate > 20% (suggests systemic issue)

### PR Auto-Comment

Script: `pr-comment-bot.ts`

- Automatically comments on PRs with quality summary
- Selector metrics, fallback stats, architecture compliance
- Supports GitHub and Azure DevOps

### Azure Analytics

Script: `azure-analytics.ts --ci`

- Generates HTML dashboard with Chart.js visualizations
- Uploads as CI artifact

---

# 3. Actual CI Pipeline

The Azure Pipelines workflow (`.azurepipelines/workflows/run-tests-playwright-workspace.yml`) executes these gates in order:

1. `npm run lint:caf` — CAF architecture linter
2. `npm run ci:gate` — Full governance gate (orchestrates sub-gates)
3. `npm run ci:locator-score` — Locator score validation
4. `npm run ci:fallback-check` — Fallback usage threshold check
5. Playwright test execution (configurable workers)
6. Health report generation
7. Automation metrics upload

---

# 4. CI Severity Model

| Type | Action | Example |
|------|--------|---------|
| Critical | Block merge | Quality score < 85, unowned selectors, spec locators |
| Warning | PR comment | Fallback rate approaching threshold, high volatility |
| Info | Logged only | Promotion candidates, optimization suggestions |

---

# 5. CI Output Requirements

CI must output:
- Selector heatmap (`selector-heatmap.ts`)
- Fallback stats (`fallback-threshold-check.ts`)
- Coverage report (`locator-injection.ts`)
- Drift report (`dom-drift-predictor.ts`)
- Release confidence report (`release-confidence.ts`)
- Auto-repair report (`auto-repair-pipeline.ts`)
- Flake triage report (`flake-triage.ts`)
