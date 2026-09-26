# CAF Validation Engine

Purpose
Provide rule set for framework validation tools.

> **Related**: See `CAFRefactoringByClaude/CAF_VALIDATION_PIPELINE.md` for the execution pipeline and CI gate integration.

---

## Validation Layers

1 Architecture validation
2 Playwright stability validation
3 Locator validation
4 Test design validation

---

## Issue Severity

Critical
Architecture violation

Moderate
Playwright anti-pattern

Minor
Code quality issue

---

## Tracker Integration

All detected issues must be appended to:

CAFRefactoringByClaude/CAF_Task_Controller.md

Format

TaskID
Issue
File
Severity
Suggested Fix

---

## T3–T5 Validation Rules

### T3 Runtime Intelligence Validation

| Rule | Severity | Check |
|------|----------|-------|
| Fallback rate > 10% | Critical | `ci:fallback-check` |
| Selector in `deprecated` state past grace | Moderate | `ci:lifecycle` |
| Promotion candidate not reviewed | Minor | `ci:promotion` |
| Score demotion not logged | Moderate | `ci:score-demotion` |

### T4 Predictive Automation Validation

| Rule | Severity | Check |
|------|----------|-------|
| DOM drift volatility > 0.7 | Critical | `check:dom-drift` |
| Auto-repair confidence < 90% applied | Critical | `repair:pipeline` |
| Cross-env variance > 10% | Moderate | `check:cross-env` |
| Repair log not maintained | Minor | `.caf-repair-log.json` |

### T5 Enterprise Governance Validation

| Rule | Severity | Check |
|------|----------|-------|
| Release confidence < 60 (NO-GO) | Critical | `ci:release-confidence` |
| Flake auto-fixable > 20% | Moderate | `ci:flake-triage` |
| Migration phase incomplete | Critical | `migrate:status` |
| PR comment contains secrets | Critical | Manual review |