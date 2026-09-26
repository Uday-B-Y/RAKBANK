# CAF Framework Specification

CAF = Component Action Fixture Architecture

Goal:
Separate UI structure, user actions, and test orchestration.

---

## Layers

### Tests
Defines test scenarios only.

### Fixtures
Create reusable test contexts.

### Actions
Represents business flows.

### Components
Encapsulates reusable UI components.

### Pages
Defines full page-level structures.

### Core
Framework utilities and base logic.

---

## Layer Responsibilities

Tests:
• call fixtures
• call actions
• contain assertions

Fixtures:
• setup browser state
• provide test context

Actions:
• orchestrate UI flows
• combine components

Components:
• encapsulate UI sections

Pages:
• page-level layout

Core:
• shared framework utilities
• base classes (BasePage, BaseAction, BaseComponent)
• synchronization (NetworkWatcher, AzureKeepAlive)
• telemetry (GlobalLocatorTelemetry, FallbackLocator)

---

## T3–T5 Extended Layers

### Runtime Intelligence (T3)
• Fallback telemetry collection and analysis
• Selector lifecycle management (active/watch/deprecated/retired)
• Automatic score demotion and promotion
• Scripts: score-updater.ts, selector-lifecycle.ts, promotion-report.ts

### Predictive Automation (T4)
• DOM drift prediction with volatility scoring
• Auto-repair pipeline (4 stages, 8 strategies)
• Cross-environment selector comparison
• Scripts: dom-drift-predictor.ts, auto-repair-pipeline.ts, cross-env-compare.ts

### Enterprise Governance (T5)
• Release confidence scoring (GO/CAUTION/NO-GO)
• Azure analytics dashboard
• PR auto-comment bot
• Flake auto-triage
• Migration orchestration (7 phases with rollback)
• Scripts: release-confidence.ts, flake-triage.ts, migration-orchestrator.ts