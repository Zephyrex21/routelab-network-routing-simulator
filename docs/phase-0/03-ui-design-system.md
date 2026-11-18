# 03 — UI and Design System

## Design intent

RouteLab uses an Apple-inspired visual direction: quiet surfaces, strong typography, generous whitespace, fine separators, limited colour and purposeful movement. It should feel like a focused engineering workspace, not a colourful gamified dashboard.

This is an independent visual system inspired by broad design principles; it does not reproduce Apple's proprietary interface assets.

## Principles

1. **Canvas first:** topology and current algorithm state receive the most visual space.
2. **Hierarchy over decoration:** labels, values and active states are more important than ornamental cards.
3. **Neutral by default:** use accent colour only for selection, action, route highlighting and important status.
4. **Reveal complexity progressively:** advanced details live in inspectors, expandable panels and event details.
5. **Motion communicates state:** animate packet movement and state transitions; avoid decorative motion that competes with the topology.

## Colour tokens

Initial tokens are implemented in `src/styles/tokens.css`. Treat these as design values, not permanent brand law; refine only through deliberate review.

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--page` | `#F5F6F8` | `#111318` | App background |
| `--surface` | `#FFFFFF` | `#191C23` | Cards and panels |
| `--surface-soft` | `#F8F9FB` | `#1E222B` | Secondary panel layer |
| `--surface-muted` | `#EEF0F3` | `#252A34` | Hover/selected neutral surface |
| `--text` | `#171A21` | `#F2F4F8` | Main text |
| `--text-secondary` | `#606875` | `#A4ADBB` | Supporting text |
| `--text-tertiary` | `#9299A4` | `#727D8D` | Metadata and hints |
| `--line` | `#E6E8ED` | `#2B303B` | Dividers and borders |
| `--accent` | `#2864DC` | `#78A4FF` | Primary action and selection |
| `--success` | `#25845B` | `#71C99D` | Valid/healthy state |

Do not encode network state using colour alone. Use text, shape or icon cues alongside colour.

## Typography

- Use a system font stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.
- Do not bundle proprietary Apple font files.
- Use tabular numerals for costs, router IDs and table values where practical.
- Page title: 32–48 px responsive; workspace title: 20–28 px; section title: 16–20 px; body: 13–15 px; metadata: 10–12 px.
- Avoid excessive all-caps. Reserve tracking-heavy uppercase for compact section labels.

## Shape, spacing and depth

- Main panel radius: 14–18 px.
- Controls and compact surfaces: 8–12 px.
- Use a 4 px spacing base; common gaps are 8, 12, 16, 24 and 32 px.
- Borders should define structure; shadows should be soft and used sparingly.
- Avoid stacking several nested cards when a divider or section label is enough.

## Interaction states

Every interactive component should define default, hover, focus-visible, active/selected, disabled, loading and error states as applicable.

- Focus: clearly visible outline with adequate offset.
- Destructive actions: require confirmation when deletion cannot be undone.
- Validation: show the error near the relevant field and provide a plain-language explanation.
- Save state: visibly distinguish saved, saving and unsaved changes.
- Stale simulation: visibly indicate that the topology differs from the topology used for the displayed run.

## Motion

- Short UI feedback: approximately 140–200 ms.
- Panel/overlay transition: approximately 180–240 ms.
- Packet movement: driven by simulation playback, not an independent arbitrary timer.
- Respect `prefers-reduced-motion`; provide a reduced or static representation.
- Do not make a user wait for decorative animations before controls become available.

## Network visual language

| Element | Proposed visual treatment |
|---|---|
| Router | Compact circular or rounded node with stable ID and selected state |
| Active link | Neutral thin line with cost label |
| Disabled link | Dashed/muted line with explicit “Down” state |
| Selected route | Accent line and ordered hop emphasis |
| Current router | Distinct ring/halo plus label such as “Processing” |
| Changed table entry | Subtle accent background and “Updated” indicator |
| Packet | Small, high-contrast marker travelling only along computed path |
| Unreachable destination | Text status and muted path; never a fabricated route |

## Network Studio layout

- Top bar: active project, algorithm selector, run controls and save state.
- Left tool rail: select, add router, connect links, delete and presets.
- Central canvas: largest area; pan/zoom and fit-to-content controls.
- Right inspector: contextual router/link properties.
- Bottom panel: collapsible event log and simulation timeline.

Panels should be resizable or collapsible where useful. On small screens, inspectors should become drawers or stacked panels; do not shrink the canvas to an unusable sliver.

## Accessibility baseline

- All controls have accessible names and keyboard access.
- Never rely on colour alone to communicate a state.
- Ensure visible focus indicators and readable contrast.
- Provide text equivalents for canvas information (selected route, router details, event list).
- Respect reduced-motion preferences.
- Tables use semantic headers and maintain understandable reading order.
