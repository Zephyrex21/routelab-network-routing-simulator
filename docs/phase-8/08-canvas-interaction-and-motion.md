# Phase 8 — Canvas Interaction & Visual Polish (0.9.2)

## Network Studio canvas

- Removed React Flow's MiniMap component. The canvas retains the compact zoom-in, zoom-out and fit-view controls.
- Enabled primary-button drag panning on the empty canvas, with selection-by-drag disabled so a drag gesture pans the topology instead of drawing a selection rectangle.
- Kept router repositioning in Select mode. Dragging a router moves that router; dragging empty canvas space moves the whole viewport. The explicit Pan tool remains available.
- Updated the canvas footer hint to explain the difference between panning the canvas and repositioning a router.

## Public homepage spacing and geometry

- Increased the centered desktop content width/gutters for the header, main content and footer.
- Added tablet and mobile gutter rules so spacing scales down without pinching the content.
- Removed the rotation from the Network Studio preview window.

## Motion and accessibility

- Public sections and feature cards reveal as they enter the viewport using IntersectionObserver.
- Feature cards use a restrained stagger, hover elevation and icon motion.
- The network illustration includes a slow packet path, a router pulse and subtle link-flow motion.
- Lab pages and the Network Studio canvas use short entrance transitions.
- Scroll reveals and the SVG packet path respect `prefers-reduced-motion`; the CSS motion rules are disabled when the preference requests reduced motion.
- No animation library or runtime dependency was added.

## Manual verification

1. Open the public homepage at desktop width and confirm the content is centered with visible left/right margins.
2. Confirm the topology preview window is level.
3. Enter Network Studio; confirm the rectangular minimap is absent and zoom/fit controls remain.
4. Drag an empty canvas area with the left mouse button; the complete topology viewport should pan.
5. Drag a router in Select mode; only that router should move.
6. Switch to Connect mode and verify dragging router handles still creates links.
7. Test both themes and responsive widths.
8. Enable the operating-system reduced-motion preference and confirm the reveal, packet, pulse and hover animations are removed or reduced.
9. Run `npm ci`, `npm test` and `npm run build`.
