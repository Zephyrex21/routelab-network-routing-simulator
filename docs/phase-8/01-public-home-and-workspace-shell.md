# Phase 8 implementation notes

## Objective

Separate RouteLab's public introduction from its interactive networking laboratory and establish a clear, consistent visual hierarchy across both surfaces.

## Public information architecture

The root path `/` now renders `PublicHomePage` directly, without `AppShell` or the workspace sidebar. It introduces the product, presents the core features and routing models, explains the learner workflow, and links into the appropriate lab workspaces.

## Workspace information architecture

All interactive tools are nested under `/lab/*`. The default `/lab` route redirects to Network Studio. The former root-level workspace routes remain as redirects for bookmark compatibility.

## Collapsible sidebar

The desktop sidebar supports two states:
- Expanded navigation with icons, labels, section context and helper hints.
- Compact icon rail with labels visually hidden while accessible names and title hints remain available.

The preference is stored locally in `routelab-sidebar-collapsed-v1`. The mobile drawer always expands to show labels and retains the Phase 7 modal-navigation behaviour.

## Typography direction

The shared Phase 8 stylesheet defines a body, small-text and caption scale. Navigation, buttons, page headers, feature cards and explanatory copy have been raised for comfortable reading. Technical graph labels can remain compact where density is intrinsic to the visualization, but ordinary helper copy and workspace metadata should not fall below the readability floor.

## Compatibility and accessibility

- Legacy workspace URLs redirect rather than fail.
- The lab has a clear Home link in its topbar.
- The collapsed navigation remains labelled for assistive technology.
- The mobile drawer remains a modal dialog surface.
- Existing light/dark theme tokens are reused.
- Public-page transitions honour `prefers-reduced-motion`.

## Release verification

Source-level regression tests cover routing separation, legacy redirects, persisted sidebar state, accessible collapsed navigation, public homepage links and typography tokens. A browser review is still required to validate visual balance and interactions after `npm ci`, `npm test` and `npm run build`.
