# CAF Architecture Checklist

Purpose
Quick validation checklist for AI agents.

---

## Tests

- [ ] Uses fixtures
- [ ] Calls actions
- [ ] No direct component imports
- [ ] Contains assertions

---

## Fixtures

- [ ] Provides context
- [ ] No UI actions

---

## Actions

- [ ] Contains workflow logic
- [ ] No assertions
- [ ] Uses components/pages

---

## Components

- [ ] Encapsulates UI elements
- [ ] Reusable across pages
- [ ] No navigation logic

---

## Pages

- [ ] Defines page structure
- [ ] No business logic

---

## Core

- [ ] Shared utilities only
- [ ] Base classes (BasePage, BaseAction, BaseComponent)
- [ ] Telemetry modules in src/core/telemetry/
- [ ] FallbackLocator in src/core/locators/

---

## T3 Runtime Intelligence

- [ ] Fallback telemetry collecting data
- [ ] Selector lifecycle states managed
- [ ] Score demotion enforced in CI
- [ ] Promotion candidates identified

## T4 Predictive Automation

- [ ] DOM drift predictor running on snapshots
- [ ] Auto-repair pipeline available
- [ ] Repair confidence >= 90% for auto-apply
- [ ] Cross-env comparison enabled

## T5 Enterprise Governance

- [ ] Release confidence scoring active
- [ ] PR auto-comments posting
- [ ] Flake triage categorizing failures
- [ ] Migration orchestrator available