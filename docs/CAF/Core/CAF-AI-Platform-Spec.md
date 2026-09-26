# CAF AI Automation Platform Specification
Version: 2.1
Scope: Tier-0 Foundation + Selector Governance
Audience: AI Agents, AI IDEs, Developers

---

# 1. Purpose

This document defines how AI systems interact with the CAF automation framework.

CAF (Component Automation Framework) converts UI DOM structures into deterministic Playwright automation code.

CAF enables:

• AI-assisted automation development  
• deterministic selector generation  
• component-based automation architecture  
• CI-enforced selector quality  
• scalable UI automation

Selectors are not simple strings.

Selectors are governed automation assets.

---

# 2. Framework Architecture

CAF follows a deterministic pipeline.

HTML Snapshot
↓
DOM Compiler
↓
Selector Scoring
↓
Component Segmentation
↓
Quality Gate
↓
Framework Generator
↓
Locator Injection
↓
Generated Automation Code

This pipeline ensures automation generation is predictable and stable.

---

# 3. DOM Compiler

## Purpose

Transform raw HTML into a structured automation analysis model.

## Input

html/{PageName}.html

Example

html/SchedulingHome.html

## Output

migration-analysis/{domain}/{PageName}.analysis.json

Example

migration-analysis/scheduling/SchedulingHome.analysis.json

## Generated Model

{
  pageName: "SchedulingHome",
  domain: "scheduling",
  selectors: [],
  segments: []
}

## Responsibilities

DOM normalization  
Selector discovery  
Component segmentation  
Selector scoring initialization

analysis.json becomes the **source of truth for automation generation**.

AI agents must treat this file as read-only.

---

# 4. Component Segmentation Engine

CAF automatically detects UI component boundaries.

Supported component types

navigation  
form  
table  
modal  
panel  
toolbar  
tabcontainer  
layout  
section

Segmentation rules

• stable IDs preferred  
• structural fingerprinting prevents duplicates  
• generic layout blocks ignored  
• semantic names extracted where possible

Example segment

{
  id: "table_1",
  type: "table",
  selectorHint: "#schedulingTable",
  semanticName: "SchedulingTable"
}

Segments drive automatic component generation.

---

# 5. Selector Scoring Model

Each selector discovered by the DOM compiler is evaluated.

Selectors must include

primary  
strategy  
score  
tier  
meta flags

Example

{
  primary: "#submitBtn",
  strategy: "id-css",
  score: 94,
  tier: "gold",
  meta: {
    dynamicId: false,
    semanticId: true
  }
}

Score range

0 – 100

Selectors are classified into tiers

Gold  
Silver  
Bronze

Scoring factors

Stable ID → strong positive  
data-testid → strong positive  
Accessible role → moderate positive  
Deep CSS selectors → penalty  
Dynamic IDs → hard penalty

Selectors are stored in analysis.json.

---

# 6. Selector Governance Rules

Selectors are governed assets.

Governance ensures

• stability  
• diversity  
• measurable quality  
• runtime improvement capability

Selectors must follow governance rules enforced by CAF.

Selectors must include

primary selector  
strategy metadata  
score  
tier classification

Selectors without scoring metadata are invalid.

---

# 7. Quality Gate Enforcement

Automation generation must pass the CAF Quality Gate.

CI must fail if any rule fails.

Quality thresholds

Average selector score < 85 → FAIL

Gold selectors < 60% → FAIL

Bronze selectors > 10% → FAIL

Dynamic IDs detected → FAIL

Selector count below minimum threshold → FAIL

Example quality report

CAF Quality Report for SchedulingHome

Total Selectors: 146  
Average Score: 91.58  
Gold %: 95.21%  
Bronze %: 0%  
Dynamic IDs: 0

Generation stops if any rule fails.

This prevents unstable automation entering the framework.

---

# 8. Selector Diversity Enforcement

CAF prevents over-reliance on a single selector strategy.

Rule

No selector strategy dominance > 95%

If exceeded

Developer warning during local runs

CI failure in protected branches

Purpose

Prevent fragile automation caused by 100% ID-based selectors.

---

# 9. Fallback Selector System

Selectors may include fallback strategies.

Example

Primary selector

#scheduleTable

Fallback selectors

[data-testid="schedule-table"]  
table[role="grid"]

Fallback execution rules

1 Primary selector attempted first  
2 Fallback selectors attempted sequentially  
3 Successful fallback recorded in runtime telemetry

Fallback telemetry will be used in future CAF tiers for automatic selector optimization.

---

# 10. Component Generator

CAF converts analysis models into framework code.

Generated directories

src/components/{domain}

src/pages/{domain}

Example generated files

SchedulingHome.SearchForm.component.ts

SchedulingHome.WorkOrdersTable.component.ts

SchedulingHome.page.ts

Component structure

class ComponentName extends BaseComponent

Page structure

class PageNamePage extends BasePage

Components are grouped through

Page.components

Example usage

page.components.searchForm.searchButton.click()

---

# 11. Locator Injection Engine

Selectors are injected into components automatically.

Ownership rules

Component owns selectors inside its DOM root

Page owns selectors outside component boundaries

Example component locator

readonly searchButton = this.root.locator('#searchButton');

Example page locator

readonly exportButton = this.page.locator('#exportButton');

CAF enforces **single-owner containment**.

---

# 12. CAF CLI Execution Pipeline

Automation generation is executed via CLI.

Example command

npm run caf html/SchedulingHome.html SchedulingHome scheduling

Execution stages

1 DOM compilation

2 Selector scoring

3 Component segmentation

4 Quality gate validation

5 Framework generation

6 Locator injection

Output artifacts

analysis.json

generated components

generated pages

quality report

---

# 13. Naming Registry Enforcement

Before creating components or pages, agents must consult the naming registry.

Registry location

registry.md

The registry contains canonical definitions for

pages

components

services

actions

This prevents duplicate framework artifacts.

---

# 14. AI Agent Interaction Rules

AI systems interacting with CAF must follow strict rules.

AI agents MUST

Use selectors from analysis.json

Use generated components

Respect component boundaries

Respect selector governance rules

AI agents MUST NOT

Generate selectors manually

Modify analysis.json automatically

Create components outside CAF generator

Bypass quality gates

Inject unscored selectors

---

# 15. AI IDE Integration

CAF is designed to support AI-assisted development environments.

Supported environments

Claude Code

Cursor IDE

GitHub Copilot

Codex

AI IDEs should assist with

Test creation

Action method generation

Assertion generation

Spec creation

AI IDEs must NOT modify core framework artifacts.

---

# 16. Tier-0 Outcome

CAF Tier-0 provides the foundation for automation governance.

Capabilities delivered

Deterministic DOM compilation

Selector scoring and governance

Component segmentation

Framework generation

Quality-gated automation creation

This enables safe AI-assisted automation development.

---

# 17. Tier 3 — Runtime Intelligence (IMPLEMENTED)

T3 introduces runtime telemetry and selector lifecycle management.

Key systems:

- **Fallback Telemetry**: `GlobalLocatorTelemetry` tracks runtime selector resolution (`src/core/telemetry/locator-telemetry.ts`)
- **FallbackLocator**: Intelligent locator that reorders candidates based on telemetry (`src/core/locators/FallbackLocator.ts`)
- **Score Demotion**: Auto-demotes selectors with high fallback rates (`scripts/score-updater.ts`)
- **Selector Lifecycle**: State machine (active/watch/deprecated/retired) (`scripts/selector-lifecycle.ts`)
- **Intelligent Promotion**: Promotes fallback selectors that consistently outperform primary (`scripts/promotion-report.ts`)

AI agents MUST NOT directly modify telemetry data or override promotion thresholds.

---

# 18. Tier 4 — Predictive Automation (IMPLEMENTED)

T4 introduces proactive selector management through prediction and automated repair.

Key systems:

- **DOM Drift Predictor**: Volatility scoring (0-1) per selector (`scripts/dom-drift-predictor.ts`)
- **Auto-Repair Pipeline**: 4-stage orchestrated repair with 8 strategies (`scripts/auto-repair-pipeline.ts`)
- **Selector Repair**: AI-assisted repair with confidence scoring; auto-apply >= 90% (`scripts/selector-repair.ts`)
- **Cross-Environment Comparison**: Detects selector variance across environments (`scripts/cross-env-compare.ts`)

AI agents MUST NOT lower the auto-repair confidence threshold (90%) or delete DOM snapshots.

---

# 19. Tier 5 — Enterprise Governance (IMPLEMENTED)

T5 introduces organization-scale automation management.

Key systems:

- **Release Confidence**: Multi-factor scoring — GO (>=80) / CAUTION (60-79) / NO-GO (<60) (`scripts/release-confidence.ts`)
- **Azure Analytics**: Dashboard generation with Chart.js visualizations (`scripts/azure-analytics.ts`)
- **PR Auto-Comment**: Automatic quality metrics on PRs (`scripts/pr-comment-bot.ts`)
- **Flake Triage**: Trace-based root cause analysis — selector/timeout/network/assertion (`scripts/flake-triage.ts`)
- **Migration Orchestration**: 7-phase state machine with rollback (`scripts/migration-orchestrator.ts`)
- **Telemetry Feedback**: Post-production telemetry loop (`scripts/telemetry-feedback.ts`)

AI agents MUST NOT override release confidence scoring or skip migration phases.

For full details, see:
- `CAF-Telemetry-Architecture.md` (T3)
- `CAF-Predictive-Engine.md` (T4)
- `CAF-Enterprise-Governance.md` (T5)
