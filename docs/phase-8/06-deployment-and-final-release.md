# Phase 8 — Deployment, CI and Final Release

## 1. Continuous integration

The GitHub Actions workflow at `.github/workflows/ci.yml` runs on pushes and pull requests targeting `main`. It installs the committed lockfile with `npm ci`, runs `npm test`, builds the Vite production bundle and runs `npm audit --audit-level=high`.

A failing test, production build or high-severity audit finding fails the quality job. Do not weaken or bypass the security gate without reviewing the advisory and recording the reason.

## 2. Dependency maintenance

Dependabot checks npm dependencies and GitHub Actions weekly. Review each generated PR, run the CI workflow and merge only after evaluating release notes and lockfile changes. Major upgrades should be handled separately from routine patch updates.

## 3. Vercel deployment

The root `vercel.json` supplies an SPA fallback so BrowserRouter paths return the Vite application shell. It also sends baseline browser security headers.

Recommended project settings:

- Framework preset: Vite.
- Root directory: repository root.
- Build command: `npm run build`.
- Output directory: `dist`.
- Install command: `npm ci`.
- Environment variables: none required by the current client-only build.

Connect the GitHub repository to Vercel and import the project. Confirm the production deployment is built from the intended `main` commit. The Vercel integration may create deployment previews for pull requests depending on project settings.

## 4. Deployment verification

After deployment, test these routes directly in a fresh browser tab and after a hard refresh:

- `/`
- `/lab/overview`
- `/lab/studio`
- `/lab/simulation`
- `/lab/packets`
- `/lab/failures`
- `/lab/compare`

Also test:
- Public homepage links into the lab.
- Desktop sidebar collapse/expand and preference persistence.
- Mobile drawer open/close and Escape behaviour.
- Light and dark themes.
- Topology create/save/reopen/import/export.
- Both routing models in Simulation Studio.
- Packet forwarding and unreachable destination handling.
- Failure experiment preserves its baseline.
- Comparison uses the same saved topology revision.
- Browser console and network tab contain no uncaught errors or failed application assets.

## 5. Security audit

Run:

```bash
npm ci
npm audit --audit-level=high
npm audit --json > npm-audit-report.json
```

Review each finding's package path, severity, advisory URL and fixed version. Prefer compatible non-breaking updates. Run tests and production build after each dependency change. Do not apply `npm audit fix --force` without reviewing major-version changes.

## 6. License decision

No license is included by this release-preparation change. The repository owner must choose and add the intended license before describing the repository as open source. A public GitHub repository alone does not grant broad reuse rights. Do not add an MIT or Apache license without the owner's explicit choice.

## 7. Academic submission

Use `03-final-academic-report.md` as the report draft, `04-algorithm-flowcharts.md` for the routing flowcharts, and `05-test-and-viva-guide.md` for manual demonstration and viva preparation. Complete identity/institution fields and add actual screenshots and command outputs.

## 8. Final release criteria

Do not tag `v1.0.0` until:
- CI passes on `main`.
- Production build succeeds.
- High/critical dependency audit findings have been resolved or formally assessed.
- Live Vercel URL and all six lab routes are tested.
- README links to the live site and includes current screenshots.
- Academic report contains actual test evidence and deployment screenshots.
- A license decision has been made and the correct file is added, if licensing is desired.
