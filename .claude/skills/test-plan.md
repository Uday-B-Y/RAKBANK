---
name: test-plan
description: Generate a functional test plan from a JIRA Epic — scans JIRA stories, codebase, and Confluence to produce a comprehensive markdown test plan.
---

# /test-plan

Generate a functional test plan from a JIRA Epic or Story link.

## Usage

```
/test-plan <JIRA-URL-or-KEY>
```

Examples:
```
/test-plan https://your-org.atlassian.net/browse/PROJ-1134
/test-plan PROJ-1134
```

## What It Does

Given a JIRA epic (or parent story), this skill:

1. **Scans JIRA** — Fetches the epic + all child issues (stories, bugs, tasks)
2. **Scans Codebase** — Searches for existing page objects, actions, fixtures, spec files, and components that relate to the feature
3. **Scans Confluence** — Searches for related documentation, design specs, or test plans
4. **Produces a Test Plan** — Writes a structured markdown file to `docs/<FEATURE>-TEST-PLAN.md`

## Execution Steps

### Step 1: Parse Input

Extract the JIRA issue key from the input. Accept both formats:
- Full URL: `https://your-org.atlassian.net/browse/PROJ-1134` → `PROJ-1134`
- Key only: `PROJ-1134`

### Step 2: Fetch JIRA Data

Use the Atlassian MCP tools to gather all issue data.

**2a. Fetch the epic/parent issue:**
```
mcp__claude_ai_Atlassian__getJiraIssue
  issueIdOrKey: <KEY>
  responseContentFormat: markdown
```

Extract: summary, description, status, reporter, labels, components.

**2b. Fetch all child issues:**
```
mcp__claude_ai_Atlassian__searchJiraIssuesUsingJql
  jql: parent = <KEY> OR "Epic Link" = <KEY> ORDER BY created ASC
  maxResults: 100
  fields: ["summary", "description", "status", "issuetype", "priority", "labels", "assignee", "components"]
  responseContentFormat: markdown
```

If the result is saved to a file (large payload), read it with `python` or `node` to parse the JSON and extract a summary table:
```
KEY | Type | Status | Priority | Summary | Assignee
```

**2c. Fetch detailed descriptions for key stories:**

Select up to 10 stories that represent the core feature flows (not backend/API-only, not Won't Do). Prioritize:
- Stories with "UI", "Page", "Filter", "Grid", "Modal", "Drawer", "Button" in summary
- Stories marked Level 1 or Level 2 priority
- Bug fixes (they reveal edge cases worth testing)

For each, fetch full description:
```
mcp__claude_ai_Atlassian__getJiraIssue
  issueIdOrKey: <CHILD-KEY>
  fields: ["summary", "description", "status"]
  responseContentFormat: markdown
```

### Step 3: Scan Codebase for Existing Coverage

Use the Explore agent or direct Grep/Glob to search for:

**3a. Extract feature keywords** from the epic summary and child story summaries. Build a keyword list like:
```
["sample test assignment", "lab assignment", "assign test", "retained", "specimen"]
```

**3b. Search for existing automation:**

```
# Spec files
Grep: pattern=<keyword> path=tests/ type=ts

# Page objects
Grep: pattern=<keyword> path=src/pages/ type=ts

# Actions
Grep: pattern=<keyword> path=src/actions/ type=ts

# Fixtures
Grep: pattern=<keyword> path=src/fixtures/ type=ts

# Components
Grep: pattern=<keyword> path=src/components/ type=ts
```

**3c. For each matching file**, read it to understand:
- What tests exist and their status
- What page methods/selectors are already built
- What actions/workflows are implemented
- What fixtures wire everything together

### Step 4: Scan Confluence (Optional)

Search Confluence for related documentation:
```
mcp__claude_ai_Atlassian__searchConfluenceUsingCql
  cql: text ~ "<epic-summary-keywords>" AND type = "page" ORDER BY lastmodified DESC
  maxResults: 10
```

If results found, fetch the top 2-3 most relevant pages:
```
mcp__claude_ai_Atlassian__getConfluencePage
  pageId: <page-id>
  responseContentFormat: markdown
```

Extract: test scenarios, acceptance criteria, business rules, edge cases that should be in the test plan.

### Step 5: Categorize Stories into Themes

Group the child issues into **testable themes** (typically 6-12 themes per epic). Each theme should map to a logical area of the feature.

Guidelines:
- Group by UI area (e.g., "Grid", "Filters", "Drawer/Modal", "Navigation")
- Group by user workflow (e.g., "Create", "Edit/Delete", "Search/Filter")
- Separate backend/API-only stories (no UI test needed)
- Separate Won't Do / cancelled stories
- Separate UX/UI-only stories (design components, no E2E test)
- Separate bug fixes — map them to the theme they fix (they indicate edge cases)

### Step 6: Generate Test Plan

Write the test plan to `docs/<FEATURE-NAME>-TEST-PLAN.md`.

Use the slugified epic summary as the filename. Example:
- "User Management" → `USER-MANAGEMENT-TEST-PLAN.md`
- "Invoice Processing Redesign" → `INVOICE-PROCESSING-REDESIGN-TEST-PLAN.md`

#### Test Plan Structure

```markdown
# <Epic Summary> — Functional Test Plan

**Epic:** [<KEY>](https://your-org.atlassian.net/browse/<KEY>) — <Summary>
**Module:** <Module path in app>
**Created:** <today's date>
**Source:** <N> JIRA stories/bugs (<Done count> Done, <Won't Do count> Won't Do, etc.)

---

## 1. Feature Overview
<2-3 paragraph description of what the feature does, derived from epic description + child stories>

### Core User Flows
<Numbered list of the main user journeys>

---

## 2. JIRA Story → Test Theme Mapping
<Table mapping the N themes to their constituent stories>

| # | Theme | Stories | Key JIRA Issues |
|---|-------|---------|-----------------|

---

## 3. Existing Automation Coverage
<What already exists in the codebase — specs, pages, actions, fixtures>
<Table of existing spec files with test counts>
<List of existing page objects and components that can be reused>
<Gap analysis: what the existing tests cover vs what they DON'T>

---

## 4. Test Plan
<One subsection per theme, each with a table of test cases>

### 4.N <Theme Name>

| ID | Test | Priority | JIRA | Type |
|----|------|----------|------|------|

ID format: <PREFIX>-<THEME>-<NNN>
  PREFIX = 3-letter abbreviation of the feature
  THEME = short theme name (e.g., NAV, FILTER, GRID, CREATE)
  NNN = sequential number

Priority: P1 (smoke/critical path), P2 (regression), P3 (edge/cosmetic)
Type: Smoke, Regression, Edge

---

## 5. Test Summary
<Total counts by priority and by theme>

---

## 6. Existing Code Assets to Reuse
<Table of existing page objects, actions, fixtures that can be extended>
<List of NEW page objects / fixtures that need to be created>

---

## 7. Automation Priority & Phasing
<4-phase rollout plan>
Phase 1 (Week 1): Smoke tests — page loads, golden path
Phase 2 (Week 2): Core functionality — filters, main workflows
Phase 3 (Week 3): Secondary flows — tabs, menus, status
Phase 4 (Week 4): Admin, permissions, edge cases, remaining

---

## 8. Pre-Requisites & Test Data
<What data/config is needed in the test environment>

---

## 9. Risks & Dependencies
<Table of risks with impact and mitigation>

---

## 10. Traceability Matrix
<Full mapping: every JIRA issue → test IDs → phase>
<Coverage percentage: how many Done stories have at least one mapped test>
```

### Naming Conventions

**Test IDs** follow the pattern:
- `SMOKE-<THEME>-001`, `REG-<THEME>-001`, `EDGE-<THEME>-001`

For a new feature, derive the prefix from the feature name:
- 3 letters, uppercase
- Must not collide with existing prefixes in the repo

**Priority mapping:**
- **P1**: Would block a user from completing the core workflow. Smoke/critical path.
- **P2**: Regression risk — feature works but edge behavior is wrong.
- **P3**: Cosmetic, viewport-specific, or unlikely edge case.

**Type mapping:**
- **Smoke**: First-time verification that the feature works at all
- **Regression**: Ongoing verification that a working feature stays working
- **Edge**: Unusual inputs, error states, concurrent access, viewport issues

### Quality Gates

Before finalizing the test plan:

1. **Every Done story** must map to at least one test ID (or be explicitly marked as "no UI test needed" with reason)
2. **Every bug** in the epic should map to at least one regression test (bugs reveal real edge cases)
3. **Phase 1** should have 5-8 tests covering the absolute golden path
4. **Total test count** should be proportional to story count (roughly 0.5-1.0 tests per story)
5. **No test should reference a Won't Do story** without noting it

### Output

After writing the file, report:
- File path
- Total test count (P1/P2/P3 breakdown)
- Theme count
- Story coverage percentage
- Phase 1 test list (the smoke suite)
- Key risks identified
