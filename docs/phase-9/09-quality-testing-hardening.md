# Phase 9.4 — Quality & Testing Hardening

## Goals

Extend the quality gates beyond deterministic model tests and builds to include static source checks and production-browser smoke coverage.

## Tooling

- ESLint 10.15.0 is invoked at an exact version through `npm exec`. The flat config checks undefined names and core correctness patterns in application JavaScript/JSX, tests and scripts; unused-variable checks apply to JavaScript modules.
- Playwright 1.65.1 is invoked at an exact version through `npm exec`. It remains test tooling and is not included in the application bundle.
- Chromium is installed separately with `npm run test:e2e:install`. CI installs Chromium and its Linux dependencies before executing the smoke suite.
- No application runtime dependencies or committed lockfile entries are added in this phase.

## Browser smoke coverage

The production bundle is served with Vite preview and exercised in Chromium using a seeded, schema-valid three-router project. Coverage includes:
- Public homepage and each lab workspace route.
- Network Studio canvas toolbar availability.
- Simulation run generation and event timeline rendering.
- Packet forwarding route calculation.
- Network Failure Lab before/after analysis.
- Comparison Lab dual-algorithm execution.
- Sidebar navigation, unknown-route handling, uncaught browser runtime errors, a 390px mobile viewport and reduced-motion preference.

The existing Node/Vite SSR suite remains responsible for active-project empty-state regression coverage. Browser smoke tests use an isolated context and temporary local-storage fixture; they do not load or modify real user data.

## Commands

```bash
npm run lint
npm test
npm run test:e2e:install
npm run test:e2e
npm run check
npm run check:release
```

`npm run check` runs lint, unit/SSR tests, a production build and browser smoke checks. `npm run check:release` adds the high-severity dependency audit. Install the Playwright browser binary once per local development machine; CI provisions it on each runner.

## Scope and limitations

This is a high-value smoke/regression layer, not a full cross-browser visual suite or formal WCAG audit. It targets Chromium at desktop and narrow mobile widths, validates critical workspace workflows and respects reduced-motion settings. Follow-up improvements can add Firefox/WebKit, axe-core, screenshot baselines and deeper keyboard/focus testing as the workspaces stabilize.
