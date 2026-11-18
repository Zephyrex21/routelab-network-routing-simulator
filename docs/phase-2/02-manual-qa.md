# Phase 2 manual QA checklist

Run `npm install`, then `npm run dev`. Complete these checks in both light and dark themes.

## Canvas and tools

- [ ] Studio opens with the Starter Network preset visible.
- [ ] Select mode allows router selection and movement.
- [ ] Add Router adds the next unused `R<number>` ID.
- [ ] Router count is capped at 20.
- [ ] Connect mode displays usable source/target handles.
- [ ] Connecting two distinct routers creates one link with cost 5.
- [ ] Connecting a router to itself is rejected.
- [ ] Reversing an existing connection does not create a duplicate.
- [ ] Pan mode moves the viewport instead of dragging router nodes.
- [ ] Zoom in, zoom out and fit-view controls work.

## Inspector and network edits

- [ ] Selecting a router opens the router inspector.
- [ ] Editing a router display name updates its canvas label.
- [ ] Router ID stays unchanged when its display label is edited.
- [ ] Selecting a link shows its endpoints, cost and status.
- [ ] Link cost accepts integers 1–999.
- [ ] Blank, fractional, zero, negative and above-999 costs are rejected or reset with a message.
- [ ] Disable/enable changes the line style and status badge.
- [ ] Deleting a link removes only that link.
- [ ] Deleting a router also removes its attached links.
- [ ] The final router cannot be deleted.

## Presets and project files

- [ ] Starter Network loads 5 routers and 6 links.
- [ ] Diamond Topology loads 4 routers and 5 links.
- [ ] Disconnected Components loads 5 routers and 3 links.
- [ ] New Project opens a name dialog and creates one router.
- [ ] Save Project creates or updates the browser-local copy.
- [ ] Replacing a dirty project through New Project, preset loading, import or saved-project opening requires a discard confirmation.
- [ ] Cancelling the discard confirmation keeps the current project and edits intact.
- [ ] Open lists saved projects and reopens the selected topology.
- [ ] Removing a library item removes only its saved copy.
- [ ] Export downloads valid JSON matching the project contract.
- [ ] Import accepts a valid exported file.
- [ ] Import rejects malformed JSON, invalid endpoints, duplicates and unsupported schema versions.
- [ ] Refreshing the page preserves a previously saved project.
- [ ] Theme preference remains intact while working in the editor.

## Responsive and accessibility

- [ ] At desktop widths, the tool rail, canvas and inspector fit without horizontal overflow.
- [ ] At tablet widths, inspector moves below the canvas.
- [ ] At mobile widths, tools and controls remain reachable and legible.
- [ ] Buttons have accessible labels or visible text.
- [ ] Focus indicators are visible.
- [ ] Reduced-motion preference is respected by custom transitions.

- [ ] Blurring an unchanged link-cost field does not mark the project dirty.
- [ ] Connect mode prevents accidental router dragging while still allowing handle-to-handle connections.
- [ ] A browser storage write failure when removing a saved project shows an error and does not claim the project was removed.
