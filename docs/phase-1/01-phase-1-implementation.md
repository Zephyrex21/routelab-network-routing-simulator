# Phase 1 — UI Foundation and Application Shell

**Status:** Implemented in the Phase 1 handoff ZIP  
**Scope:** Application frame, navigation, overview, workspace layouts, shared UI primitives, theme and responsive behaviour.

## What was implemented

- React Router application routes for Overview, Network Studio, Simulation, Packet Explorer and Compare.
- Persistent desktop sidebar and top application bar, with responsive mobile navigation drawer.
- Active navigation states, page context, workspace label and About RouteLab dialog.
- Light/dark theme provider with localStorage persistence and a safe fallback when storage is unavailable.
- Overview screen explaining the product, both routing approaches, the learning flow, current phase, next milestone, recent-project empty state and guided scenario cards.
- Network Studio workspace frame with left tool rail, centre canvas preview, right inspector and bottom event log.
- Honest placeholder screens for Simulation, Packet Explorer and Compare. These explain the future feature without showing invented execution data.
- Reusable UI primitives: buttons, icon buttons, badges, cards, card headings, input/select fields, tabs, tooltips, separators, dialog and toast provider.
- Visible keyboard focus, skip link, accessible icon labels, modal Escape handling, modal focus handling and mobile drawer focus handling.
- Responsive layouts for desktop, tablet and mobile, plus reduced-motion support.

## Routes

| Path | Screen | Phase 1 behaviour |
|---|---|---|
| `/` | Overview | Product introduction, learning models, current milestone and empty recent-project state |
| `/studio` | Network Studio | Workspace frame and clearly labelled non-interactive topology concept |
| `/simulation` | Simulation | Explanation and inert control preview; no simulation executes |
| `/packets` | Packet Explorer | Source/destination journey layout; no packet route is calculated |
| `/compare` | Compare algorithms | Conceptual comparison; no runtime metrics are fabricated |
| `*` | Not found | Recovery link to Overview |

## Product honesty boundaries

Phase 1 does not implement network creation, topology editing, graph persistence, routing algorithms, routing tables, simulation playback, packet movement or live comparison metrics. Controls which would imply those features are disabled or clearly labelled as future-phase concepts. The topology illustration is decorative and has accessible text identifying it as a non-interactive preview.

## Shared UI primitive inventory

| Component | Intended use |
|---|---|
| `Button` | Primary, secondary and ghost actions; small, medium and large sizes |
| `IconButton` | Compact icon-only actions with an accessible label |
| `Badge` | Neutral and semantic status labels |
| `Card`, `CardHeading` | Consistent surfaces and section headers |
| `Input`, `Select` | Labelled form controls with hints and error state support |
| `Tabs` | Accessible button-based view selection |
| `Tooltip` | Short contextual labels for compact controls |
| `Separator` | Semantic visual separation |
| `Dialog` | Modal with Escape dismissal, basic focus handling and backdrop dismissal |
| `ToastProvider`, `useToast` | App-level notification primitive for later interactive phases |

## Design implementation

- Neutral-first surfaces, restrained blue accent, soft borders and subtle shadows.
- System font stack; no proprietary font files or remote font dependency.
- Shared light/dark design tokens in `src/styles/tokens.css`.
- Responsive shell and screen styles in `src/styles/global.css`.
- No external image/font dependency is required for the Phase 1 interface.

## Run locally

```bash
npm install
npm run dev
```

## Phase 1 acceptance checklist

- [x] All five main application screens have route destinations.
- [x] Active sidebar navigation reflects the current route.
- [x] Mobile navigation can be opened, closed, dismissed with Escape and navigated by keyboard.
- [x] Light/dark theme can be toggled and persists across reloads where localStorage is available.
- [x] Overview introduces the product and gives the user a clear starting point.
- [x] Create-project and sample-topology entry points are visible but disabled until Phase 2.
- [x] Network Studio contains the specified top bar, tool rail, canvas, inspector and event panel slots.
- [x] Unsupported functionality is not presented as already working.
- [x] Shared controls have consistent visual states and visible focus styling.
- [x] Reduced-motion preferences are respected.
- [x] Layouts adapt at desktop, tablet and mobile breakpoints.

## Verification notes

The source and import paths should be checked with the included `npm run build` command after dependencies are installed. The authoring environment used for this handoff did not complete `npm install` because the npm registry request timed out; therefore a successful Vite production build and browser-level visual test are not claimed here.
