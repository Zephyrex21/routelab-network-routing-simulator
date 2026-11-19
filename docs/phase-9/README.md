# Phase 9 — Visual Identity & Premium UI Refinement

## 9.1 Design System Foundation

RouteLab uses an Apple-inspired editorial minimalism direction: calm neutral surfaces, strong typography, restrained blue interaction colour, consistent spacing and subtle motion.

### Typography
- Primary interface family: Inter, with native system fallbacks.
- Technical/numeric family: IBM Plex Mono, with native monospace fallbacks.
- Body copy: 15px with a comfortable 1.62 line-height.
- Supporting copy: 12–14px.
- Metadata: 11px; use only for truly secondary information.
- Page headings: responsive 34–42px.
- Homepage display headings: responsive 58–82px on desktop, reduced on narrow screens.
- Use tabular numerals for costs, counters and numeric comparison values.

### Colour
- Light canvas: `#F6F7F9`; primary surface: `#FFFFFF`.
- Dark canvas: `#101319`; primary surface: `#181D26`.
- Primary interaction accent: restrained blue.
- Green, amber and red are reserved for status meanings.
- Keep borders visible but quiet and maintain readable contrast in both themes.
- Graph colours must preserve consistent meanings across workspaces.

### Spacing and layout
- Use the shared `--space-*` scale instead of one-off values.
- Main content uses a consistent responsive `--page-gutter`.
- Keep reading widths controlled and preserve generous section spacing.
- Use shared radius tokens for controls, cards and larger panels.

### Motion
- Keep ordinary control feedback around 150–200ms.
- Use 250–350ms for larger page/panel transitions.
- Avoid decorative motion that competes with algorithm playback.
- Always honour `prefers-reduced-motion`.

### Implementation boundary
Phase 9.1 establishes shared tokens and base hierarchy. It does not change routing-engine semantics, topology persistence contracts, project data or simulation algorithms. Subsequent Phase 9 stages apply this foundation to the public homepage and individual lab workspaces.
