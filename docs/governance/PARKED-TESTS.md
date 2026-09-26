# Parked Tests

Tests intentionally excluded from `@ci-pass` until the documented blocker is resolved.

**Rules:**
- One row per parked test. Update the row if re-parked; never duplicate.
- Parked tests must NOT carry the `@ci-pass` tag.
- Re-entry trigger must be observable (a commit SHA, a product fix, an env state).

## Index

| Parked On | Test ID | Spec:Line | Blocker Class | Reason | Last Attempt SHA | Re-Entry Trigger |
|-----------|---------|-----------|---------------|--------|------------------|------------------|
| _none_    |         |           |               |        |                  |                  |

## Blocker classes

| Class | Meaning |
|-------|---------|
| `product-limit` | App behaviour cannot be exercised by any test; needs product fix. |
| `parallel-collision` | Another agent reverts shared-component changes; needs coordination. |
| `infra` | Env/CI/seed data broken outside test scope. |
| `flaky-timing` | Race condition that selector tweaks cannot stabilize. |
| `unknown` | Root cause not isolated within 3 fix attempts. |
