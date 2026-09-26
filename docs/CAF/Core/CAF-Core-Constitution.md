# CAF Core Constitution
Version: 2.0
Status: Active
Applies To: All CAF development, AI agents, CI governance

---

## 1. Purpose

CAF (Composable Automation Framework) exists to:

- Automate UI automation development
- Reduce developer effort
- Eliminate locator fragility
- Enable deterministic generation
- Support AI-assisted workflows without hallucination risk
- Provide measurable governance and CI enforcement

---

## 2. Architectural Invariants (Non-Negotiable)

### 2.1 Determinism
- Same HTML + same version → same output
- No timestamp-based generation
- No random naming
- No implicit mutation

### 2.2 Layer Isolation

| Layer | Responsibility |
|--------|---------------|
| DOM Compiler | Parse and score selectors |
| Generator | Create structural files only |
| Injector | Bind locators into classes |
| Component | Encapsulate scoped locators |
| Page | Aggregate components + page-owned locators |
| Spec | Contain business flow only |
| CI Gate | Enforce structural quality |

No cross-layer contamination allowed.

---

## 3. Selector Governance Principles

- No spec-level locators.
- All locators must have ownership.
- Selector scoring is mandatory.
- ID over-reliance must be balanced.
- Runtime fallback usage must be tracked.
- Low-quality selectors must fail CI.

---

## 4. AI Usage Policy (Core Rule)

AI may assist in:
- Semantic grouping
- Naming suggestions
- Refactor proposals
- Locator optimization suggestions

AI may NOT:
- Invent selectors
- Modify selector score logic
- Inject locators into specs
- Bypass CI gate
- Auto-merge structural changes

All AI output must pass deterministic validation.

---

## 5. Migration Boundary

Legacy POM defects are managed under `/docs/migration`.
They do not define CAF architecture.

CAF architecture is independent and forward-looking.

---

## 6. Governance Model

CAF must be:

- Measurable
- Enforced via CI
- Versioned
- Drift-monitored
- AI-compatible

---

## 7. T4 Predictive Automation Principles

### 7.1 Autonomous Repair Governance

- Auto-repair MUST have a confidence threshold (>= 90%) before auto-applying
- Repairs below confidence threshold MUST require manual review
- All repair attempts MUST be logged in `.caf-repair-log.json`
- Auto-repair MUST NOT modify analysis.json directly

### 7.2 Cross-Environment Promotion

- Cross-environment selector promotion MUST require CI validation
- Environment variance > 10% MUST block promotion
- DOM snapshots (`.caf-dom-snapshots/`) MUST be preserved for audit trail

### 7.3 DOM Drift Prediction

- Volatility scores are informational; they do not block merges automatically
- Critical-risk selectors (volatility > 0.7) MUST trigger alerts
- Prediction accuracy MUST be validated against actual drift outcomes

---

## 8. T5 Enterprise Governance Principles

### 8.1 Release Confidence

- Release confidence scoring CANNOT be bypassed or overridden
- GO/CAUTION/NO-GO thresholds MUST be enforced in CI
- Scoring weights can only be changed via documented governance process

### 8.2 Migration Safety

- Migration rollback capability MUST be preserved at all phases
- No migration phase can be skipped or force-completed
- Migration state (`migration-state.json`) is an auditable artifact

### 8.3 Flake Governance

- Flake auto-classification does NOT override manual review
- Auto-fixable flakes MUST still go through CI validation after fix
- Flake resolution time is a tracked KPI (target: < 24h for selector-type)

### 8.4 Telemetry Feedback

- Production telemetry feeds back into selector governance automatically
- Telemetry-driven score adjustments MUST be logged and auditable
- Feedback loop latency target: < 1 CI cycle