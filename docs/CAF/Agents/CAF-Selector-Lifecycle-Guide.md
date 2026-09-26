# CAF Selector Lifecycle Guide
Version: 1.0
Created: 2026-03-17
Tier: T3 (Runtime Intelligence)
Status: IMPLEMENTED

---

## 1. Overview

The Selector Lifecycle system manages selectors through defined states based on runtime telemetry data. This guide is for developers and AI agents working with selector lifecycle management.

---

## 2. Lifecycle States

```
active → watch → deprecated → retired
  ↑                              │
  └──── promotion ───────────────┘
```

### 2.1 Active

**Meaning**: Selector is healthy and in regular use.

**Entry criteria**:
- New selector from DOM compiler
- Promoted from `watch` (improved health)
- Promoted from `deprecated` (manual override)

**Monitoring**: Normal telemetry collection

**Exit trigger**: Fallback rate exceeds monitoring threshold

### 2.2 Watch

**Meaning**: Selector showing degradation; under active monitoring.

**Entry criteria**: Fallback rate exceeds watch threshold

**Duration**: Configurable monitoring period

**Actions during watch**:
- Increased telemetry frequency
- Flagged in CI reports
- Candidate for auto-repair (T4)

**Exit to active**: Health improves (fallback rate drops)
**Exit to deprecated**: Sustained degradation through monitoring period

### 2.3 Deprecated

**Meaning**: Scheduled for removal. Grace period before retirement.

**Entry criteria**: Sustained failure in `watch` state

**Grace period**: Configurable (allows dependent code to be updated)

**Actions during deprecation**:
- CI warning on every run
- Listed in retirement candidates report
- Auto-repair attempted (T4)

**Exit to active**: Manual override with justification
**Exit to retired**: Grace period expires

### 2.4 Retired

**Meaning**: Removed from active use. No longer resolved during test execution.

**Entry criteria**: Grace period expired from `deprecated`

**Actions**:
- Removed from selector resolution
- Archived in lifecycle log
- Not deleted from history (audit trail)

---

## 3. CLI Commands

```bash
# View current lifecycle states
npm run ci:lifecycle

# Check promotion candidates
npm run ci:promotion

# View lifecycle state file
cat .caf-selector-lifecycle.json
```

---

## 4. State File

Location: `.caf-selector-lifecycle.json`

```json
{
  "selectorId": {
    "state": "active",
    "enteredAt": "2026-03-17T10:00:00Z",
    "fallbackRate": 0.05,
    "totalRuns": 42
  }
}
```

---

## 5. Integration with Other Systems

| System | Interaction |
|--------|------------|
| Telemetry (T3) | Drives state transitions based on fallback rate |
| Score Demotion (T3) | Demoted selectors may trigger `watch` |
| Auto-Repair (T4) | Repair attempted for `watch` and `deprecated` selectors |
| DOM Drift (T4) | High volatility may accelerate deprecation |
| Release Confidence (T5) | Lifecycle health contributes to confidence score |

---

## 6. AI Agent Rules

AI agents interacting with selector lifecycle:

**MAY**: Read lifecycle state, recommend transitions, suggest repairs
**MUST NOT**: Directly modify `.caf-selector-lifecycle.json`, skip grace periods, force retirement without CI validation
