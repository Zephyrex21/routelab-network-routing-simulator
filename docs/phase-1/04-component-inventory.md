# Phase 1 — Component inventory

| Component | Location | Notes |
|---|---|---|
| `AppShell` | `src/components/layout/AppShell.jsx` | Shared route outlet, mobile navigation state, keyboard drawer behaviour |
| `Sidebar` | `src/components/layout/Sidebar.jsx` | Active route navigation and workspace context |
| `Topbar` | `src/components/layout/Topbar.jsx` | Route title, theme toggle, help dialog |
| `PageHeader` | `src/components/layout/PageHeader.jsx` | Consistent page title and actions |
| `Brand` | `src/components/layout/Brand.jsx` | Inline vector mark and wordmark |
| `ThemeProvider` | `src/app/ThemeProvider.jsx` | Persistent light/dark appearance |
| `Button` | `src/components/ui/Button.jsx` | Primary, secondary, ghost and size variants |
| `IconButton` | `src/components/ui/IconButton.jsx` | Accessible icon-only button |
| `Badge` | `src/components/ui/Badge.jsx` | Neutral and semantic states |
| `Card` / `CardHeading` | `src/components/ui/Card.jsx` | Shared surface and heading primitives |
| `Input` / `Select` | `src/components/ui/Field.jsx` | Label, hint and validation-state primitives |
| `Tabs` | `src/components/ui/Tabs.jsx` | Button-group selection control |
| `Tooltip` | `src/components/ui/Tooltip.jsx` | Hover/focus helper label |
| `Separator` | `src/components/ui/Separator.jsx` | Semantic visual divider |
| `Dialog` | `src/components/ui/Dialog.jsx` | Portal, modal semantics, Escape/backdrop close, focus handling |
| `ToastProvider` / `useToast` | `src/components/ui/ToastProvider.jsx` | App-level status notifications |

`src/components/ui/index.js` exports the shared primitives from one entry point for future features.
