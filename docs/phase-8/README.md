# Phase 8 — Public Home & Workspace Shell

Phase 8 introduces a public-facing product homepage and separates it from the interactive lab application.

## Routes

- `/` — public RouteLab homepage, rendered without the workspace sidebar.
- `/lab` — redirects to `/lab/studio`.
- `/lab/overview` — lab overview.
- `/lab/studio`, `/lab/simulation`, `/lab/packets`, `/lab/failures`, `/lab/compare` — the six workspace destinations.

Legacy workspace URLs redirect to their new `/lab/*` paths so saved bookmarks continue to work.

## Workspace navigation

- Desktop sidebar can be collapsed into an icon rail and expanded again from the topbar.
- Collapsed preference is stored locally under `routelab-sidebar-collapsed-v1`.
- Icons retain accessible labels and native title hints in collapsed mode.
- Mobile navigation remains an expanded modal drawer with background inertness, focus containment, Escape close and scroll locking.
- Workspace topbar includes breadcrumbs and a direct route back to the public homepage.

## Typography and visual system

A shared typography scale raises navigation, descriptions, field controls, section headings, badges and helper text. The public homepage uses the existing RouteLab colour tokens, system font stack and NetworkIllustration component, and adapts to mobile widths. Reduced-motion preferences remain respected.

## Validation

Run locally from the repository root:

```bash
npm ci
npm test
npm run build
npm run dev
```

Review these manual cases:
- Open `/` in a fresh tab and confirm no lab sidebar is present.
- Choose “Go to the lab” and confirm the workspace shell appears.
- Collapse and expand the desktop sidebar; refresh and confirm the preference persists.
- Use the mobile menu and verify it opens as a full-width label drawer.
- Navigate directly to each `/lab/*` route and refresh.
- Open each legacy URL and confirm it redirects to the corresponding `/lab/*` destination.
- Review typography and both themes at desktop, tablet and mobile sizes.
