# CAF Generator Contract
Version: 2.0
Status: Deterministic Layer

---

# 1. Purpose

Generator converts:

analysis.json → framework structure

It does NOT:
- Inject locators
- Modify scores
- Mutate analysis
- Write speculative code

---

# 2. Deterministic Requirements

Given identical input:
- File names identical
- Class names identical
- Order identical
- Registry identical

No timestamps.
No randomness.
No conditional branching on environment.

---

# 3. File Ownership Rules

Generator may create:

- Page
- Component files
- Registry file
- (Future) Actions + Assertions

Generator must NOT:
- Overwrite manually modified files without flag
- Remove injected content
- Delete non-generated logic

---

# 4. Safe Overwrite Strategy

Modes:

--safe (default)
  Skip existing files

--force
  Overwrite generated sections only

--dry-run
  Show diff without writing

---

# 5. Registry Rules

- Must auto-update
- Must detect duplicate page names
- Must fail if conflict detected

---

# 6. Naming Determinism

Component name resolution priority:

1. semanticName
2. ID
3. heading
4. fallback to type_index

---

# 7. Generator Integrity Checks

Must verify:

- Every segment has owner
- No duplicate component name
- Registry entry created
- No silent failures

---

# 8. AI Involvement Policy

AI may:
- Suggest semantic grouping
- Suggest component split

AI may NOT:
- Modify generation logic without CI approval
- Create structural files outside generator flow