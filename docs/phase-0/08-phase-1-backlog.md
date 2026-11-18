# 08 — Phase 1 Backlog: UI Foundation and Application Shell

## Objective

Turn the Phase 0 visual foundation into the real application shell, without implementing the graph editor or routing algorithms yet.

## Work packages

### P1.1 — App shell and navigation

- Create route structure for Overview, Network Studio, Simulation, Packet Explorer and Compare.
- Add persistent app header and active-project context.
- Add responsive navigation behaviour.
- Define empty states for screens whose later-phase engines are not yet implemented.

**Acceptance:** all screens are reachable; active navigation is clear; the shell works at desktop, tablet and mobile widths.

### P1.2 — Design tokens and primitive components

- Refine colour, typography, spacing, radii and elevation tokens.
- Implement buttons, icon buttons, inputs, selects, tabs, badges, tooltips, cards, separators, dialogs and toasts.
- Implement visible focus, disabled, loading, success and error states.
- Keep light/dark theme parity.

**Acceptance:** components use shared tokens; no feature screen introduces ad hoc visual styles for common controls.

### P1.3 — Overview page

- Add create project and load sample entry points.
- Add recent projects section with empty state.
- Add learning-oriented explanation of Distance Vector and Link State.
- Add quick-start scenario cards.

**Acceptance:** a first-time user can identify what the application does and where to begin.

### P1.4 — Workspace frame

- Establish the top bar, left tool rail slot, canvas region, right inspector slot and bottom event panel slot.
- Use placeholders only; do not suggest that topology editing or simulation already works.
- Ensure panels can collapse or switch to drawers on narrower viewports.

**Acceptance:** workspace proportions and responsive transitions are usable before graph functionality exists.

### P1.5 — Theme and accessibility

- Persist theme preference.
- Respect reduced motion.
- Add keyboard-friendly navigation and focus management for overlays.
- Audit contrast and text alternatives for canvas-dependent information.

**Acceptance:** theme switching is consistent, keyboard paths are usable and reduced-motion is respected.

## Phase 1 non-goals

- No actual router creation or edge editing.
- No routing algorithm execution.
- No packet animation.
- No fake simulation results or placeholder metrics presented as live.
- No backend, account system or cloud persistence.

## Suggested implementation order

1. Route and layout shell.
2. Design tokens and shared primitives.
3. Overview page.
4. Workspace frame and empty states.
5. Theme, responsive and accessibility polish.
6. Visual review and acceptance test.

## Phase 1 definition of done

The application has a coherent visual system, navigable screen shell, useful Overview page, responsive Network Studio frame, accessible theme control and honest empty states. No routing functionality is implied before Phase 2 and Phase 3 are complete.
