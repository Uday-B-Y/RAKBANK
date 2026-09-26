# CAF Injection Contract
Version: 3.0
Status: Structural Enforcement Layer (T3-T5 Extended)

---

# 1. Purpose

Injector binds selectors into:

- Component classes
- Page class (page-owned selectors)

Injector must not modify:
- Component structure
- Method definitions
- Registry
- Generator output

---

# 2. Ownership Model

Selector belongs to:

Component if:
- Located inside segment root

Page if:
- Outside any segment root

No unowned selector allowed.

---

# 3. Coverage Enforcement

After injection:

Print:
Total Selectors
Injected to Components
Injected to Page
Unowned Selectors

If Unowned > 0:
- CI failure

---

# 4. Injection Strategy

Short-term:
- Controlled region markers

Future:
- AST-based injection

---

# 5. Strongly Typed Locators

All injected locators must be:

readonly <name>: Locator

Example:
readonly searchButton = this.root.locator('[data-testid="search"]')

---

# 6. No Silent Skips

Injector must fail if:

- Target file missing
- Injection anchor missing
- Write operation fails

---

# 7. Idempotency

Running injector twice must not duplicate properties.

---

# 8. AI Involvement Policy

AI may:
- Suggest grouping
- Suggest renaming

AI may NOT:
- Inject locators directly
- Modify ownership routing
- Rewrite component file outside injection contract

---

# 9. Telemetry Injection Points (T3)

The injection pipeline integrates with the T3 runtime telemetry system at the following points:

### FallbackLocator Integration

When the code generator (`scripts/caf-generator.ts`) scaffolds page files, it generates `FallbackLocator` instances that automatically connect to telemetry:

```
Page File → FallbackLocator constructor → receives LocatorConfig { primary, fallback[], score }
         → FallbackLocator.resolve()   → consults GlobalLocatorTelemetry singleton
         → Records success/fallback     → GlobalLocatorTelemetry.record()
```

### Injection-Time Telemetry Hooks

| Hook Point | System | Description |
|------------|--------|-------------|
| Locator resolution | `GlobalLocatorTelemetry` | Records primary vs. fallback usage per selector |
| Fallback trigger | `selector-usage.ts` | Persists fallback count to `selector-usage.json` |
| Dynamic reordering | `FallbackLocator.resolve()` | Consults telemetry to promote fallback selectors (>40% fallback after 3+ runs) |
| Score demotion | `score-updater.ts` | Reads telemetry data to demote low-performing selectors |
| Lifecycle transition | `selector-lifecycle.ts` | Uses telemetry data to move selectors through active → watch → deprecated → retired |

### Telemetry Data Flow

```
FallbackLocator.resolve()
  ├── GlobalLocatorTelemetry.record()        ← In-memory (singleton)
  ├── recordFallbackUsage(selector)          ← Persistent (selector-usage.json)
  └── recordPrimarySuccess(selector)         ← Persistent (selector-usage.json)
```

### Injection Contract Rules for Telemetry

- Telemetry recording MUST be non-blocking (never delays test execution)
- `GlobalLocatorTelemetry` is a singleton — no per-test instantiation
- `selector-usage.json` is append-only during test runs; analysis scripts read after completion
- AI agents MUST NOT directly modify `selector-usage.json` or `GlobalLocatorTelemetry` internals

---

# 10. Predictive Injection Points (T4)

### Auto-Repair Integration

When the auto-repair pipeline (`scripts/auto-repair-pipeline.ts`) generates repaired selectors, they re-enter the injection contract:

| Stage | Action | Contract Boundary |
|-------|--------|-------------------|
| Detection | DOM drift predictor flags volatile selectors | Read-only telemetry access |
| Repair | Selector repair engine generates candidates | Creates repair proposal (not injected) |
| Validation | Repair confidence scored (8 strategies) | Must meet ≥90% confidence for auto-apply |
| Injection | Repaired selector written to page file | Must follow injection contract (idempotent, typed, anchored) |

### Cross-Environment Injection

- `cross-env-compare.ts` compares selectors across environments
- Promoted selectors from cross-env analysis follow the same injection contract as generator output
- AI agents MUST NOT auto-merge repair results without CI validation

---

# 11. Enterprise Governance Injection Points (T5)

### Migration Orchestrator

The migration orchestrator (`scripts/migration-orchestrator.ts`) may bulk-inject selectors during migration phases:

- Phase injection MUST be idempotent (re-running same phase produces same result)
- Phase rollback MUST restore previous injection state
- Migration injection follows all rules in sections 1–8

### AI Governance

AI agents MUST NOT:
- Modify telemetry injection hooks
- Override FallbackLocator promotion thresholds
- Bypass injection contract during auto-repair
- Skip CI validation for repair-injected selectors