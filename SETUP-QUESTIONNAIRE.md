# Tinubu E2E — Setup Questionnaire

> **Purpose:** Fill in the answers below so the framework can be configured for your application.
> Once completed, update the corresponding files as noted in the "Where to apply" column.

---

## 1. Application Details

| # | Question | Your Answer | Where to Apply |
|---|----------|-------------|----------------|
| 1.1 | **Application name** (display name for reports/docs) | _e.g. Tinubu Credit Insurance_ | `README.md`, `CLAUDE.md`, `package.json` description |
| 1.2 | **Tech stack** — frontend framework? | _React / Angular / Vue / jQuery / Other_ | `BasePage.ts` modal handler selectors, `CLAUDE.md` selector strategy |
| 1.3 | **UI component library?** | _MUI / Ant Design / Bootstrap / PrimeNG / Custom / None_ | `BasePage.ts` modal & backdrop selectors |
| 1.4 | **Does the app use a CSS-in-JS solution?** (styled-components, CSS modules, Tailwind) | _Yes/No — which one?_ | Selector strategy in `CLAUDE.md` (avoid auto-generated classes) |
| 1.5 | **Does the app use `data-testid` attributes?** | _Yes / No / Partially_ | Selector priority order in `CLAUDE.md` |
| 1.6 | **Authentication method** | _Username+password / SSO / OAuth / MFA / Other_ | `tests/setup/global-setup.ts` |
| 1.7 | **Post-login landing page URL path** | _e.g. `/dashboard`, `/home`, `/`_ | `tests/setup/global-setup.ts` |

---

## 2. Environments

| # | Question | Your Answer | Where to Apply |
|---|----------|-------------|----------------|
| 2.1 | **Dev/Test environment URL** | _e.g. `https://test.tinubu.com`_ | `.env.example` → `BASE_URL` |
| 2.2 | **Are there multiple environments?** (dev, staging, UAT, etc.) | _List them_ | Consider adding `src/config/environments.ts` if >1 |
| 2.3 | **Test user credentials** — how are they provisioned? | _Static accounts / API-created / Self-service_ | `.env.example`, `global-setup.ts` |
| 2.4 | **Are there different user roles to test?** | _e.g. Admin, Standard, ReadOnly_ | `.env.example` (add role-specific creds) |

---

## 3. CI/CD Platform

| # | Question | Your Answer | Where to Apply |
|---|----------|-------------|----------------|
| 3.1 | **CI platform** | _Azure DevOps / GitHub Actions / AWS CodeBuild / Jenkins / GitLab CI / Other_ | `playwright.config.ts` → `isCI` detection, `NetworkWatcher.ts` |
| 3.2 | **CI env var for detection** | _e.g. `AZURE=true`, `GITHUB_ACTIONS=true`_ | `playwright.config.ts` line 20 |
| 3.3 | **Pipeline YAML location** | _e.g. `.azurepipelines/`, `.github/workflows/`_ | Create directory and pipeline file |
| 3.4 | **Artifact storage** — where do test reports go? | _Pipeline artifacts / S3 / Blob storage / Other_ | Pipeline YAML, reporter config |
| 3.5 | **Desired worker count in CI?** | _e.g. 2, 4_ | `playwright.config.ts` → workers |

---

## 4. Third-Party Scripts

| # | Question | Your Answer | Where to Apply |
|---|----------|-------------|----------------|
| 4.1 | **Analytics/tracking scripts in the app?** | _e.g. Google Analytics, Segment, Mixpanel_ | `ThirdPartyBlocker.ts` → `BLOCKED_PATTERN` |
| 4.2 | **Chat/support widgets?** | _e.g. Intercom, Zendesk, Freshdesk_ | `ThirdPartyBlocker.ts` → `BLOCKED_PATTERN` |
| 4.3 | **In-app guidance tools?** | _e.g. Whatfix, Pendo, WalkMe_ | `ThirdPartyBlocker.ts` → `BLOCKED_PATTERN` + locator handler |
| 4.4 | **A/B testing tools?** | _e.g. LaunchDarkly, Optimizely, Split_ | `ThirdPartyBlocker.ts` → `BLOCKED_PATTERN` |

---

## 5. Modal/Dialog Patterns

| # | Question | Your Answer | Where to Apply |
|---|----------|-------------|----------------|
| 5.1 | **How do modals/dialogs render?** | _Bootstrap `.modal` / MUI `Dialog` / HTML `<dialog>` / Custom_ | `BasePage.ts` → `registerModalHandler()` |
| 5.2 | **Modal trigger selector** (visible state) | _e.g. `#alert-modal.in` / `[role="dialog"][aria-modal="true"]`_ | `BasePage.ts` line 34 |
| 5.3 | **Modal backdrop selector** | _e.g. `.modal-backdrop` / `.MuiBackdrop-root`_ | `BasePage.ts` → `dismissBlockingModal()` |
| 5.4 | **Are there notification toasts/snackbars?** | _Yes/No — selector?_ | May need a handler in `BasePage.ts` |

---

## 6. Repository & Collaboration

| # | Question | Your Answer | Where to Apply |
|---|----------|-------------|----------------|
| 6.1 | **Git hosting** | _GitHub / Azure Repos / GitLab / Bitbucket_ | Remote setup, PR workflow |
| 6.2 | **Repo name** | _e.g. `Tinubu-E2E`_ | `git remote add origin <url>` |
| 6.3 | **Branch strategy** | _main + feature / main + release / trunk-based_ | Branch governance in `CLAUDE.md` |
| 6.4 | **Who will be writing tests?** | _Team names / roles_ | `CLAUDE.md` module assignment |

---

## How to Apply

Once you've filled in the answers above, update these files:

1. **`.env.example`** — Set `BASE_URL` and credential variable names (Q2.1, 2.3, 2.4)
2. **`tests/setup/global-setup.ts`** — Uncomment and update login selectors (Q1.6, 1.7)
3. **`src/core/base/BasePage.ts`** — Update modal/backdrop selectors in `registerModalHandler()` and `dismissBlockingModal()` (Q5.1–5.3)
4. **`src/core/sync/ThirdPartyBlocker.ts`** — Update `BLOCKED_PATTERN` with your app's third-party domains (Q4.1–4.4)
5. **`src/core/sync/NetworkWatcher.ts`** — Verify CI env var detection matches your platform (Q3.1–3.2)
6. **`playwright.config.ts`** — Update `isCI` detection, worker count, `baseURL` fallback (Q3.1, 3.2, 3.5)
7. **`src/utils/constants.ts`** — Update `CommonTestData` interface with your app's entity types
8. **`CLAUDE.md`** — Update selector strategy, tech stack, commands
9. **`README.md`** — Update project description, tech stack, quick start

---

## Notes

- This questionnaire is a one-time exercise. Once applied, delete or archive this file.
- If answers are unknown, the framework ships with safe generic defaults that work for most React/Bootstrap apps.
- For questions about CAF architecture, see `docs/CAF-ARCHITECTURE.md`.
