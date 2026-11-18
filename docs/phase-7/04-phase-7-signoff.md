# Phase 7 sign-off

## Delivered

- [x] Vite dev/preview server loopback binding, local allowlist and strict filesystem serving.
- [x] Vite pinned to the patched `7.3.8` release.
- [x] Removed unused Recharts dependency.
- [x] Pinned React Flow to compatible v12.12.1 and React Router DOM to v7.18.5 without introducing major-version migrations.
- [x] Dialog accessible name/description, background inertness, focus containment, Escape close and focus restoration.
- [x] Mobile navigation drawer focus containment, background inertness, explicit close action and body scroll lock.
- [x] Form ID generation, hint/error associations and error announcements.
- [x] IconButton safe default button type.
- [x] Error toasts use assertive announcements; status toasts remain polite and atomic.
- [x] WCAG AA contrast for tertiary text against page/surface backgrounds.
- [x] Dynamic browser theme-color, responsive small-screen refinements and keyboard focus.
- [x] Phase 7 regression tests, manual QA matrix, security/dependency review and sign-off documentation.

## Automated verification

Run `npm test`. Phase 6 baseline: 118 tests. Phase 7 adds 13 source-contract regression tests, so expected current suite: **131 tests**.

The packaging environment did not have installed node_modules, and npm registry access timed out while attempting to generate the lockfile. Therefore the production Vite build, live Chromium/browser verification and complete `npm audit` report remain required local release checks.

## Dependency audit qualification

The previous local install output reported four high-severity vulnerabilities but did not include package names or advisory paths. Vite is now pinned to the patched 7.3.8 release and the unused Recharts package is removed, but transitive dependency findings cannot be claimed resolved without the user's local `npm audit --json` output. Do not mark the dependency audit clean based solely on the passing unit/source tests.

## Release gate

Phase 7 code and automated source-contract checks are complete. Before public deployment, locally run:

```powershell
npm install
npm test
npm run build
npm audit --audit-level=high
npm run preview
```

Then complete the manual QA matrix in `02-manual-qa.md` at desktop and mobile viewport sizes.
