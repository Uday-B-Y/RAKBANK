# CAF Scaffold Workflow
Version: 2.0
Audience: Developers, Fresh Graduates, AI Agents
Status: Mandatory

---

# 1. Purpose

This document defines the ONLY approved workflow for:

- Creating new automation pages
- Generating components
- Injecting locators
- Updating registry
- Ensuring CI compliance

Manual page or component creation is strictly prohibited.

---

# 2. The Single Command Lifecycle

CAF enforces a single-command workflow:

npm run caf <html> <pageName> <domain>

Example:
npm run caf html/SchedulingHome.html SchedulingHome scheduling

---

# 3. What the CLI Must Do (End-to-End)

Step 1 — DOM Compilation
- Parse HTML
- Score selectors
- Generate analysis.json

Step 2 — Quality Gate
- Enforce selector quality
- Enforce diversity rules
- Fail fast if violations

Step 3 — Structural Generation
- Generate components
- Generate page object
- Update registry
- Enforce deterministic naming

Step 4 — Locator Injection
- Assign selectors to owners
- Inject typed locators
- Validate 100% coverage
- Print coverage report

Step 5 — CI Verification
- Determinism check
- Structure validation
- Registry conflict check

If any step fails → process exits with error.

---

# 4. Developer Rules

Developers MUST NOT:

- Manually create page files
- Manually create components
- Add locators directly into spec
- Bypass injection process
- Edit generated regions manually
- Duplicate page names

All structural work must go through CLI.

---

# 5. Safe Modes

--safe (default)
- Does not overwrite existing files

--force
- Overwrites generated sections only

--dry-run
- Prints diff without writing

Fresh grads must always use --safe unless instructed.

---

# 6. Registry Governance

- Every page must register automatically.
- Duplicate detection must fail generation.
- Registry conflicts must block merge.

---

# 7. Page Creation Workflow (For Team)

1. Obtain HTML snapshot.
2. Run CLI.
3. Review coverage report.
4. Commit generated structure.
5. Implement business logic in spec only.
6. CI validates.

---

# 8. AI IDE Usage

AI IDEs must:

- Use CLI to generate structure.
- Suggest semantic improvements.
- Never manually create structural files.
- Never inject locators outside injection engine.

---

# 9. Preventing Structural Mistakes

CAF prevents:

- Duplicate pages
- Unowned selectors
- Raw locator leakage
- Inconsistent naming
- Registry corruption
- Injection drift

---

# 10. Success Definition

A new page is considered valid only when:

- CLI completes successfully
- Injection coverage = 100%
- CI passes
- No spec contains raw locator

This workflow guarantees deterministic, scalable automation.