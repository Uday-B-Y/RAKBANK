# CAF AI Lint Rules

Purpose
Prevent AI-generated architecture violations.

---

## Forbidden Imports

Tests → components  
Tests → pages  

Fixtures → components  

---

## Forbidden Logic

Actions must NOT contain assertions.

Components must NOT perform navigation.

Pages must NOT contain workflow logic.

---

## Locator Rules

Priority order

getByTestId  
CSS  
getByRole  
getByLabel / getByText  
XPath (last resort)

---

## Playwright Stability Rules

Avoid:

waitForTimeout()

Prefer:

locator.waitFor()

---

## File Naming

actions: *.actions.ts
assertions: *.assertions.ts
components: *.component.ts
pages: *.page.ts
fixtures: *.fixture.ts

---

## T3–T5 Lint Rules

### Telemetry Rules (T3)

- MUST NOT directly modify `selector-usage.json`
- MUST NOT override `GlobalLocatorTelemetry` promotion thresholds
- MUST NOT disable telemetry collection in FallbackLocator
- MUST use `ci:fallback-check` to validate fallback rates

### Predictive Rules (T4)

- MUST NOT lower auto-repair confidence threshold below 90%
- MUST NOT delete DOM snapshots (`.caf-dom-snapshots/`)
- MUST NOT modify repair strategy scoring weights without justification
- MUST NOT auto-merge repair results without CI validation

### Enterprise Rules (T5)

- MUST NOT override release confidence scoring
- MUST NOT skip migration phases
- MUST NOT post PR comments containing credentials or secrets
- MUST NOT modify flake triage classification logic without review

### Protected Script Rules

AI-generated code MUST NOT import from or modify these protected scripts:
- T3: score-updater.ts, selector-lifecycle.ts, fallback-threshold-check.ts
- T4: dom-drift-predictor.ts, auto-repair-pipeline.ts, selector-repair.ts
- T5: release-confidence.ts, migration-orchestrator.ts, flake-triage.ts

See `Framework-Guardrails.md` for the full protected list.