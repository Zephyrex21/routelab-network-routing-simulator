# Phase 1 — Manual QA checklist

Use this checklist after running the app locally with `npm install` and `npm run dev`.

## Navigation

- [ ] Open each route from the sidebar.
- [ ] Confirm the active navigation item matches the current route.
- [ ] Refresh on `/studio`, `/simulation`, `/packets` and `/compare`; confirm Vite serves the SPA route.
- [ ] Open an unknown route and use the return-to-overview link.

## Theme

- [ ] Toggle light to dark and back.
- [ ] Refresh and confirm the selected theme remains.
- [ ] Disable localStorage in browser settings and confirm the UI remains usable.
- [ ] Check text, icons, borders and surfaces in both themes.

## Responsive shell

- [ ] Check desktop widths at 1440 px and 1024 px.
- [ ] Check tablet width around 768 px.
- [ ] Check mobile widths around 390 px and 320 px.
- [ ] Open the mobile drawer, navigate to a page, and confirm it closes.
- [ ] Open the mobile drawer and dismiss it with Escape or the scrim.
- [ ] Check keyboard focus remains visible and cycles within the open drawer.

## Accessibility

- [ ] Use Tab from the top of the page and confirm the skip link appears.
- [ ] Verify icon-only controls expose accessible labels.
- [ ] Open the About dialog; test Escape, backdrop click, focus placement and focus return.
- [ ] Enable reduced motion at OS/browser level and check transitions are minimized.
- [ ] Confirm the topology concept has a text alternative and is labelled non-interactive.

## Scope integrity

- [ ] Confirm New project and Load sample are unavailable in Phase 1.
- [ ] Confirm topology tools are disabled.
- [ ] Confirm simulation controls are illustrative only and disabled.
- [ ] Confirm Packet Explorer displays no fabricated route or hop values.
- [ ] Confirm Compare displays conceptual information only and no fabricated runtime metrics.
