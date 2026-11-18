# Phase 7 manual QA matrix

Run `npm install`, then `npm test`, `npm run build`, `npm run audit`, and `npm run preview` before final presentation.

| Area | Test | Expected result |
|---|---|---|
| Dev-server security | Start `npm run dev`; inspect Vite's printed URLs | Local URL only; no LAN address is advertised by default. |
| Preview security | Start `npm run preview` | Preview binds to loopback. |
| Desktop navigation | Visit every sidebar route | Correct page title, active navigation state and no horizontal overflow. |
| Mobile navigation | At 320px, 375px and 760px, open the menu; press Tab, Shift+Tab and Escape | Drawer traps focus, main content is inert, body does not scroll, and focus returns to menu trigger. |
| Dialog keyboard | Open a project dialog; press Tab, Shift+Tab and Escape | Focus remains in dialog; Escape closes; focus returns to the trigger. |
| Dialog pointer | Click backdrop and then inside dialog | Backdrop closes; clicking dialog contents does not. |
| Theme | Toggle light/dark, reload | Theme persists and browser theme-color follows active theme. |
| Focus visibility | Navigate with keyboard only | Focus indicator remains clearly visible. |
| Reduced motion | Enable OS reduced-motion preference | Nonessential transitions and animations are minimized. |
| Form association | Inspect input labels, hints and validation errors with accessibility tree | IDs are unique; hint/error associations are present; errors are announced. |
| Topology editor | Create/edit/move/delete routers and links; save/reopen | Existing Phase 2 behaviours remain intact. |
| Simulation | Run both algorithms, seek and step through event stream | Existing Phase 4 playback and state snapshots remain intact. |
| Packet Explorer | Test a reachable, unreachable and self-route case | Forwarding follows next hops; unreachable route does not animate; self-route is zero-hop. |
| Failure Lab | Disable a cut link and save a variant | Baseline is unchanged; variant gets a new project identity. |
| Comparison | Compare presets and a generated topology | Route costs agree; distinct algorithm metrics remain separately labelled. |
| JSON import | Import valid, malformed, wrong-schema and over-1MB files | Only a valid schema-versioned project under the size limit is accepted. |
| Browser storage | Simulate unavailable/full localStorage | User receives an error; current unsaved workspace remains usable. |
| Narrow screens | Visit every route at 320px and 375px widths | No clipped primary actions or page-level horizontal scroll. |

Automated Phase 7 source-contract tests live in `tests/phase7-quality-regressions.test.js`.
