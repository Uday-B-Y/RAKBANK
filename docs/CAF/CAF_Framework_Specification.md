# CAF Framework Specification (AI Runtime Version)

Purpose  
Provide a concise architecture reference for AI agents.

Full reference:
Core/CA-Framework_Specifications.md

---

## CAF Architecture

CAF = Component Action Fixture

Layer hierarchy

tests → fixtures → actions → pages → components → core

Dependencies allowed only downward.

---

## Layer Responsibilities

### Tests
Define scenarios.

Must:
• use fixtures
• call actions
• contain assertions

Must NOT:
• import components directly
• manipulate locators

---

### Fixtures
Provide test context.

Examples:
auth setup  
test data  
environment configuration

Must NOT:
• perform UI interactions

---

### Actions
Represent user workflows.

Examples:
create sample  
assign test  
submit report

Must:
• orchestrate flows
• use components/pages

Must NOT:
• contain assertions

---

### Components
Reusable UI elements.

Examples:
buttons  
dialogs  
tables  
forms

Must NOT:
• perform navigation
• implement business logic

---

### Pages
Represent page structure.

Must contain:

locators  
component composition

Must NOT:

workflow logic

---

### Core
Framework utilities.

Examples:

BaseAction
BaseComponent
LocatorHealer
Telemetry (GlobalLocatorTelemetry, FallbackLocator)

---

## T3–T5 Specifications

### T3 Runtime Intelligence (IMPLEMENTED)

MUST:
• Track fallback usage via telemetry
• Enforce selector lifecycle transitions
• Demote scores when fallback rate exceeds threshold
• Promote fallback selectors that consistently outperform primary

MUST NOT:
• Modify telemetry data directly
• Override promotion thresholds

### T4 Predictive Automation (IMPLEMENTED)

MUST:
• Predict DOM drift via volatility scoring
• Auto-repair selectors at >= 90% confidence
• Compare selectors across environments

MUST NOT:
• Auto-merge repairs without CI validation
• Delete DOM snapshots

### T5 Enterprise Governance (IMPLEMENTED)

MUST:
• Score release confidence (GO/CAUTION/NO-GO)
• Auto-comment on PRs with quality metrics
• Categorize flakes by root cause
• Support migration rollback at all phases

MUST NOT:
• Override release confidence scoring
• Skip migration phases
• Post credentials in PR comments