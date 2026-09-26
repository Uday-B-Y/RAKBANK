# CAF AI System Map
AI Agent Operational Guide

Version: 2.0
Audience: AI IDEs (Claude Code, Cursor, Codex) and Automation Engineers

------------------------------------------------------------

PURPOSE

This document explains how the CAF automation framework operates.

AI agents must use this document to understand:

- how UI automation is generated
- how DOM is analyzed
- how selectors are scored
- how components are generated
- how locators are injected
- how quality gates enforce stability

This document prevents AI agents from making structural mistakes in the framework.

------------------------------------------------------------

CAF AUTOMATION PIPELINE

CAF follows a deterministic generation pipeline.

HTML Snapshot
↓
DOM Compiler
↓
DOM Segmenter
↓
Selector Inventory
↓
Quality Gate
↓
CAF Generator
↓
Locator Injection
↓
Playwright Execution

------------------------------------------------------------

PRIMARY CAF SCRIPTS

Location:

scripts/

These scripts form the automation generation engine.

------------------------------------------------------------

CAF CLI

File:
scripts/caf-cli.ts

Purpose:

The CAF CLI orchestrates the full automation generation pipeline.

Execution command:

npm run caf html/<Page>.html <PageName> <domain>

Example:

npm run caf html/SchedulingHome.html SchedulingHome scheduling

Pipeline executed by CLI:

compileDom()
runQualityGate()
runFullGenerator()
injectLocators()

------------------------------------------------------------

DOM COMPILER

File:
scripts/dom-compiler.ts

Purpose:

Converts a UI HTML snapshot into the CAF analysis structure.

Output:

migration-analysis/<domain>/<page>.analysis.json

Output contains:

{
  pageName
  domain
  selectors[]
  segments[]
}

Selectors represent potential element locators.

Segments represent component boundaries.

------------------------------------------------------------

DOM SEGMENTER

File:
scripts/dom-segmenter.ts

Purpose:

Automatically detects logical UI components.

Supported component types:

navigation
form
table
modal
section

Segmentation rules priority:

1. Stable ID
2. aria-label
3. heading
4. legend

Structural deduplication prevents duplicate component creation.

Example segment:

{
  id: "table_0",
  type: "table",
  selectorHint: "#WorkItemsTable",
  semanticName: "WorkItems"
}

------------------------------------------------------------

SELECTOR INVENTORY

Part of the DOM compilation process.

Purpose:

Extracts and evaluates selectors from the DOM.

Selectors are scored based on stability.

Scoring considers:

- ID stability
- semantic attributes
- ARIA roles
- data-testid attributes
- DOM structure

Example selector entry:

{
  primary: "#submitButton",
  score: 95,
  strategy: "id-css",
  tier: "gold"
}

Selector tiers:

Gold   → Highly stable
Silver → Acceptable
Bronze → Weak selectors

------------------------------------------------------------

QUALITY GATE

File:
scripts/quality-gate.ts

Purpose:

Prevents unstable automation code from being generated.

Quality thresholds:

Average selector score ≥ 85
Gold selectors ≥ 60%
Bronze selectors ≤ 10%
Dynamic IDs = 0
Minimum selectors ≥ 20
Strategy diversity check enabled

If any rule fails:

CAF generation stops.

------------------------------------------------------------

CAF GENERATOR

File:
scripts/caf-full-generator.ts

Purpose:

Generates Playwright automation files.

Generated files:

src/components/<domain>/<Page>.<Component>.component.ts
src/components/<domain>/<Page>.components.ts
src/pages/<domain>/<Page>.page.ts

Component generation is based on DOM segments.

Example generated file:

SchedulingHome.WorkItemsTable.component.ts

------------------------------------------------------------

LOCATOR INJECTION

File:
scripts/locator-injection.ts

Purpose:

Injects locators into components and page objects.

Locator ownership model:

Component Owned → locator injected into component
Orphan Locator → injected into page

Strict containment rule:

Locator belongs to nearest parent component.

Example component locator:

readonly submitButton = this.root.locator('#submitButton')

Example page locator:

readonly globalSearch = this.page.locator('#search')

------------------------------------------------------------

GENERATED FRAMEWORK STRUCTURE

src/
 ├─ components/
 │   └─ scheduling/
 │        SchedulingHome.WorkItemsTable.component.ts
 │        SchedulingHome.TechniciansTable.component.ts
 │        SchedulingHome.components.ts
 │
 ├─ pages/
 │   └─ scheduling/
 │        SchedulingHome.page.ts
 │
 └─ core/
      BasePage.ts
      BaseComponent.ts

------------------------------------------------------------

AI AGENT RESPONSIBILITIES

AI agents may perform:

- DOM analysis
- selector scoring
- component generation
- locator healing
- test generation
- flake analysis

AI agents must NOT modify:

scripts/dom-compiler.ts
scripts/dom-segmenter.ts
scripts/quality-gate.ts
scripts/caf-full-generator.ts
scripts/locator-injection.ts

These scripts define core framework behavior.

------------------------------------------------------------

AI TEST GENERATION STRATEGY

Tests must follow this hierarchy:

Page → Component → Locator

Example:

await schedulingHomePage
  .components
  .workItemsTable
  .submitButton
  .click()

Avoid direct selectors.

Bad example:

page.locator('#submitButton')

------------------------------------------------------------

CAF STABILITY PRINCIPLES

CAF enforces the following rules:

Deterministic generation
Selector scoring
Component isolation
Locator ownership
Quality gate enforcement

These principles reduce test flakiness.

------------------------------------------------------------

IMPLEMENTED AI CAPABILITIES (T3–T5)

The following capabilities are fully implemented:

T3 Runtime Intelligence:
- Auto locator healing via FallbackLocator (src/core/locators/FallbackLocator.ts)
- Fallback telemetry via GlobalLocatorTelemetry (src/core/telemetry/locator-telemetry.ts)
- CI fallback threshold enforcement (scripts/fallback-threshold-check.ts)
- Selector lifecycle management: active/watch/deprecated/retired (scripts/selector-lifecycle.ts)
- Automatic score demotion (scripts/score-updater.ts)
- Intelligent selector promotion (scripts/promotion-report.ts)
- Selector heatmap generation (scripts/selector-heatmap.ts)
- Flake classification: selector/timeout/network/assertion (scripts/flake-classifier.ts)

T4 Predictive Automation:
- DOM drift detection with volatility scoring (scripts/dom-drift-predictor.ts)
- DOM diff impact analysis (scripts/dom-diff-impact.ts)
- Auto-repair pipeline — 4 stages (scripts/auto-repair-pipeline.ts)
- Selector repair — 8 strategies, 90% auto-apply (scripts/selector-repair.ts)
- Cross-environment comparison (scripts/cross-env-compare.ts)
- Locator optimization analysis (scripts/locator-optimizer.ts)
- Promotion scoring (scripts/promotion-scoring.ts)

T5 Enterprise Governance:
- Release confidence scoring: GO/CAUTION/NO-GO (scripts/release-confidence.ts)
- Azure analytics dashboard (scripts/azure-analytics.ts)
- PR auto-comment bot (scripts/pr-comment-bot.ts)
- Flake auto-triage with trace parsing (scripts/flake-triage.ts)
- Migration orchestration — 7 phases with rollback (scripts/migration-orchestrator.ts)
- Telemetry feedback loop (scripts/telemetry-feedback.ts)
- Health report generation (scripts/generate-health-report.ts)

For detailed architecture, see:
- Core/CAF-Telemetry-Architecture.md (T3)
- Core/CAF-Predictive-Engine.md (T4)
- Core/CAF-Enterprise-Governance.md (T5)

------------------------------------------------------------

AI AGENT PROTECTED SCRIPTS (T3–T5)

In addition to core scripts, AI agents must NOT modify these without justification:

T3: score-updater.ts, selector-lifecycle.ts, promotion-report.ts, fallback-threshold-check.ts
T4: dom-drift-predictor.ts, auto-repair-pipeline.ts, selector-repair.ts, cross-env-compare.ts
T5: release-confidence.ts, flake-triage.ts, migration-orchestrator.ts, pr-comment-bot.ts

See Framework-Guardrails.md for the complete protected scripts list.

------------------------------------------------------------

SUMMARY

CAF is an AI-native automation framework.

It converts HTML snapshots into structured Playwright automation through:

DOM Analysis
Selector Intelligence
Component Generation
Locator Injection
Quality Governance
Runtime Telemetry (T3)
Predictive Automation (T4)
Enterprise Governance (T5)

AI agents interacting with this framework must follow this document to ensure stable automation generation.