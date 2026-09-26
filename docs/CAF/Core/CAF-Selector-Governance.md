# CAF Selector Governance
Version: 2.0
Status: Enforced via CI

---

# 1. Purpose

Selector governance ensures:

- Stability
- Diversity
- Measurable quality
- Runtime self-correction
- AI-safe optimization

Selectors are not strings.
They are governed assets.

---

# 2. Selector Scoring Model

Each selector must contain:

- primary
- strategy
- score
- tier (gold / silver / bronze)
- meta flags

Example:
{
  "primary": "#submitBtn",
  "strategy": "id-css",
  "score": 94,
  "tier": "gold",
  "meta": {
    "dynamicId": false,
    "semanticId": true
  }
}

---

# 3. Minimum Quality Enforcement

CI must fail if:

- Average Score < 85
- Gold % < 60%
- Bronze % > 10%
- Dynamic IDs detected
- Selector count < minimum threshold

---

# 4. Selector Diversity Enforcement

Max dominance rule:

No single strategy may exceed 95%.

If exceeded:
- Warning in dev
- CI failure in protected branches

Purpose:
Prevent 100% ID dependency.

---

# 5. ID Over-Reliance Balancing

If ID strategy > 90%:

- Emit warning
- Encourage role-based and attribute diversification
- Suggest semantic enhancement

---

# 6. Runtime Fallback Telemetry (Tier 3) — IMPLEMENTED

Implementation files:
- `src/core/telemetry/locator-telemetry.ts` — `GlobalLocatorTelemetry` class
- `src/core/locators/FallbackLocator.ts` — Intelligent locator with telemetry integration
- `src/core/telemetry/selector-usage.ts` — Persistent file-based storage

Track per selector:
- `totalRuns`: Total resolution attempts
- `fallbackRuns`: Times fallback was activated
- `fallbackRate`: Computed ratio (fallbackRuns / totalRuns)
- Resolution duration (ms)
- Which fallback tier was used

CI enforcement: `npm run ci:fallback-check` (threshold: <= 10 per run)

---

# 7. Automatic Score Demotion (Tier 3) — IMPLEMENTED

Script: `scripts/score-updater.ts`

If fallback rate > threshold:
- Reduce score by configurable decrement
- Recalculate tier (gold → silver → bronze)
- Trigger CI warning
- Log demotion event

CI command: `npm run ci:score-demotion`

---

# 8. Selector Lifecycle (Tier 3) — IMPLEMENTED

Script: `scripts/selector-lifecycle.ts`

State machine: `active → watch → deprecated → retired`

| State | Entry Condition | Exit Condition |
|-------|----------------|----------------|
| active | Healthy, in use | Fallback rate exceeds threshold |
| watch | Degradation detected | Stabilizes or degrades further |
| deprecated | Consistent failures | Grace period expires |
| retired | End of life | N/A (removed from active use) |

Retirement requires grace period. CI command: `npm run ci:lifecycle`

---

# 9. Intelligent Promotion System (Tier 3) — IMPLEMENTED

Scripts: `scripts/promotion-scoring.ts`, `scripts/promotion-report.ts`

Promotion algorithm (in `GlobalLocatorTelemetry.shouldPromoteFallback()`):

If fallback selector succeeds consistently:
- Threshold: >40% fallback rate after 3+ runs
- Promote fallback to primary
- Log mutation event
- Require CI validation

CI command: `npm run ci:promotion`

---

# 10. AI Involvement Policy

AI may:
- Suggest diversification
- Recommend selector rewrite
- Suggest scoring adjustments

AI may NOT:
- Mutate analysis.json automatically
- Bypass governance thresholds
- Inject unscored selectors